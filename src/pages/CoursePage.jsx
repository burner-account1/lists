import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Papa from "papaparse";
import BreadcrumbNav from "./BreadcrumbNav";

const CoursePage = ({ data, row }) => {
  const location = useLocation();

  // ---------- 1) UseEffect to configure Google Tag on path/title change ----------
  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", "AW-16837978710", {
        page_title: row?.courseTitle || row?.id || "Unknown Course",
        page_path: location.pathname,
      });
    }
  }, [location, row]);

  // ---------- 2) Local state ----------
  const [htmlMessage, setHtmlMessage] = useState("");
  const [packingList, setPackingList] = useState([]);
  const [documentLink, setDocumentLink] = useState("");
  const [courseInfo, setCourseInfo] = useState({});
  const [neededList, setNeededList] = useState([]);
  const [desiredQuantities, setDesiredQuantities] = useState({});
  const [colorStates, setColorStates] = useState([]);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const notGreenCount = colorStates.filter((c) => c !== "green").length;
  const courseId = row?.id || "unknownCourse";

  // ---------- 3) Fetch data from row ----------
  useEffect(() => {
    if (!row) return;

    setDocumentLink(row.CoursePagePDF || "");
    setCourseInfo({
      title: row.courseTitle || "No Title Available",
      message: row.message || "No additional information available.",
    });

    const fetchCourseData = async () => {
      try {
        if (!row.courseSheetUrl) {
          console.warn("No courseSheetUrl provided for this course");
          return;
        }
        const response = await fetch(row.courseSheetUrl);
        const text = await response.text();
        const parsedData = Papa.parse(text, { header: true, delimiter: "\t" }).data;

        const itemsList = parsedData.map((itm) => ({
          ...itm,
          crossedOff: false,
        }));

        setPackingList(itemsList);
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };

    fetchCourseData();
  }, [row]);

  // ---------- 4) Load from localStorage ----------
  useEffect(() => {
    try {
      const savedColors = localStorage.getItem(`colorStates_${courseId}`);
      if (savedColors) {
        const parsed = JSON.parse(savedColors);
        if (Array.isArray(parsed)) setColorStates(parsed);
      }
    } catch {}

    try {
      const savedNeeded = localStorage.getItem(`neededList_${courseId}`);
      if (savedNeeded) {
        const parsedNeeded = JSON.parse(savedNeeded);
        if (Array.isArray(parsedNeeded)) setNeededList(parsedNeeded);
      }
    } catch {}

    try {
      const savedQuantities = localStorage.getItem(`desiredQuantities_${courseId}`);
      if (savedQuantities) {
        const parsedQ = JSON.parse(savedQuantities);
        if (parsedQ && typeof parsedQ === "object") setDesiredQuantities(parsedQ);
      }
    } catch {}

    setHasLoadedFromStorage(true);
  }, [courseId]);

  // ---------- 5) Save to localStorage whenever states change ----------
  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    localStorage.setItem(`colorStates_${courseId}`, JSON.stringify(colorStates));
  }, [colorStates, courseId, hasLoadedFromStorage]);

  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    localStorage.setItem(`neededList_${courseId}`, JSON.stringify(neededList));
  }, [neededList, courseId, hasLoadedFromStorage]);

  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    localStorage.setItem(
      `desiredQuantities_${courseId}`,
      JSON.stringify(desiredQuantities)
    );
  }, [desiredQuantities, courseId, hasLoadedFromStorage]);

  // ---------- 6) Once packingList is loaded, default color states & desiredQuantities ----------
  useEffect(() => {
    if (packingList.length) {
      if (colorStates.length === 0) {
        setColorStates(Array(packingList.length).fill("red"));
      }
      if (Object.keys(desiredQuantities).length === 0) {
        const initQ = {};
        packingList.forEach((item, i) => {
          const rec = parseInt(item.Recommended, 10);
          initQ[i] = !isNaN(rec) ? rec : 1;
        });
        setDesiredQuantities(initQ);
      }
    }
  }, [packingList, colorStates.length, desiredQuantities]);

  // ---------- Helpers ----------
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const cycleColorAtIndex = (index) => {
    setColorStates((prev) => {
      const updated = [...prev];
      const current = updated[index] || "red";
      if (current === "red") {
        updated[index] = "yellow";
      } else if (current === "yellow") {
        updated[index] = "green";
      } else {
        updated[index] = "red";
      }
      return updated;
    });
  };

  const handleQuantityChange = (index, newVal) => {
    setDesiredQuantities((prev) => ({
      ...prev,
      [index]: newVal,
    }));
  };

  const handleItemNameClick = (e, item, index) => {
    e.preventDefault();
    setColorStates((prev) => {
      const updated = [...prev];
      updated[index] = "yellow";
      return updated;
    });

    const qty = parseInt(desiredQuantities[index], 10) || 1;
    const clonedItem = { ...item, QUANTITY: qty };
    const alreadyInNeeded = neededList.some(
      (needed) => needed.ITEM === item.ITEM && needed.LINK === item.LINK
    );
    if (!alreadyInNeeded) {
      setNeededList((prev) => [...prev, clonedItem]);
    }

    if (item.LINK && isValidUrl(item.LINK)) {
      window.open(item.LINK, "_blank", "noopener,noreferrer");
    }
  };

  const toggleThoughts = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleUpdateNeededQuantity = (idx, newVal) => {
    setNeededList((prev) =>
      prev.map((itm, i) => (i === idx ? { ...itm, QUANTITY: newVal } : itm))
    );
  };

  const handleRemoveNeededItem = (idx) => {
    setNeededList((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---------- Memo for M/O color-based counts ----------
  const moNotGreenCounts = useMemo(() => {
    let yellowNotGreen = 0; // M
    let greenNotGreen = 0;  // R
    let whiteNotGreen = 0;  // everything else

    packingList.forEach((item, i) => {
      const state = colorStates[i] || "red";
      // if it's not green...
      if (state !== "green") {
        if (item["M/O"] === "M") {
          yellowNotGreen++;
        } else if (item["M/O"] === "R") {
          greenNotGreen++;
        } else {
          whiteNotGreen++;
        }
      }
    });

    return {
      yellowNotGreen,
      greenNotGreen,
      whiteNotGreen,
      totalNotGreen: yellowNotGreen + greenNotGreen + whiteNotGreen,
    };
  }, [packingList, colorStates]);

  // ---------- Render ----------
  return (
    <div
      style={{
        backgroundColor: "#fff",
        color: "#000",
        minHeight: "100vh",
        padding: "1rem",
      }}
    >
      <BreadcrumbNav data={data} row={row} />

      {/* Show dynamic \"not green\" counts by M/O color at the top */}
      <div style={{ marginTop: "1rem", color: "#000", fontWeight: "bold" }}>
        <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>Yellow (Mandatory) unchecked: {moNotGreenCounts.yellowNotGreen}</li>
          <li>White (Optional) unchecked: {moNotGreenCounts.whiteNotGreen}</li>
          <li>Green (SOFG2 recs) unchecked: {moNotGreenCounts.greenNotGreen}</li>
        </ul>
      </div>

      <h1 style={{ color: "#000" }}>{courseInfo.title}</h1>
      <p style={{ color: "#000" }}>{courseInfo.message}</p>

      {documentLink && isValidUrl(documentLink) && (
        <button
          onClick={() => window.open(documentLink, "_blank", "noopener,noreferrer")}
          style={{
            backgroundColor: "#fff",
            color: "blue",
            border: "2px solid blue",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          Download/Print Packing List
        </button>
      )}

      <div style={{ maxWidth: "100%", overflowX: "auto", marginTop: "1rem" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "600px",
            backgroundColor: "#fff",
            color: "#000",
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#f7f7f7",
              zIndex: 2,
              color: "#000",
            }}
          >
            <tr>
              <th style={{ width: "50px", padding: "6px" }} />
              <th style={{ textAlign: "left", padding: "6px" }}>Item</th>
              <th style={{ textAlign: "left", padding: "6px" }}>Quantity</th>
              <th style={{ padding: "6px" }} />
              <th style={{ textAlign: "center", padding: "6px", color: "#000" }}>
                Check
              </th>
            </tr>
          </thead>
          <tbody>
            {packingList.map((item, index) => {
              let rowStyle = {};
              if (item["M/O"] === "M") {
                rowStyle.backgroundColor = "rgba(255, 255, 0, 0.5)"; // Yellow-ish
              } else if (item["M/O"] === "R") {
                rowStyle.backgroundColor = "rgba(0, 255, 0, 0.5)"; // Green-ish
              } else {
                rowStyle.backgroundColor = "#fff"; // White
              }

              const squareColor = colorStates[index] || "red";
              const validLink = item.LINK && isValidUrl(item.LINK);

              const itemNameStyle = {
                textDecoration: "none",
                color: "#000",
                cursor: validLink ? "pointer" : "default",
              };

              const hasThoughts =
                item.THOUGHTS && item.THOUGHTS.trim().length > 0;

              return (
                <React.Fragment key={index}>
                  <tr style={rowStyle}>
                    <td style={{ padding: 0, verticalAlign: "top" }}>
                      <div
                        onClick={() => cycleColorAtIndex(index)}
                        style={{
                          backgroundColor: squareColor,
                          width: "100%",
                          minWidth: "60px",
                          minHeight: "60px",
                          cursor: "pointer",
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      {validLink ? (
                        <a
                          href={item.LINK}
                          onClick={(e) => handleItemNameClick(e, item, index)}
                          style={{ ...itemNameStyle, color: "blue" }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.ITEM || "No Data"}
                        </a>
                      ) : (
                        <span style={itemNameStyle}>
                          {item.ITEM || "No Data"}
                        </span>
                      )}
                      {hasThoughts && (
                        <button
                          onClick={() => toggleThoughts(index)}
                          style={{
                            marginLeft: "8px",
                            backgroundColor: "#fff",
                            border: "1px solid #007bff",
                            borderRadius: "4px",
                            color: "#007bff",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            transition: "background-color 0.2s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#e6f0ff")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#fff")
                          }
                          title="Show/Hide Thoughts"
                        >
                          Context
                        </button>
                      )}
                    </td>
                    <td style={{ padding: "8px", color: "#000" }}>
                      {item.QUANTITY || "0"}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input
                        type="number"
                        min="1"
                        value={desiredQuantities[index] || ""}
                        onChange={(e) =>
                          handleQuantityChange(index, e.target.value)
                        }
                        style={{
                          width: "40px",
                          backgroundColor: "#fff",
                          color: "#000",
                          border: "1px solid #000",
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "center", padding: "8px" }}>
                      <input
                        type="checkbox"
                        style={{
                          width: "35px",
                          height: "35px",
                          backgroundColor: "#fff",
                          color: "#000",
                          accentColor: "#000",
                          border: "1px solid #000",
                        }}
                        checked={squareColor === "green"}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setColorStates((prev) => {
                            const updated = [...prev];
                            updated[index] = isChecked ? "green" : "red";
                            return updated;
                          });
                        }}
                      />
                    </td>
                  </tr>
                  {hasThoughts && expandedRows[index] && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ backgroundColor: "#f9f9f9", padding: "10px" }}
                      >
                        <strong>Context:</strong>
                        <div style={{ marginTop: "5px", color: "#333" }}>
                          {item.THOUGHTS}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ color: "#000" }}>Needed Items</h3>
        {neededList.length === 0 ? (
          <p style={{ color: "#000" }}>No items added yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ color: "#000" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "6px" }}>Item</th>
                <th style={{ textAlign: "left", padding: "6px" }}>Quantity</th>
                <th style={{ width: "40px" }} />
              </tr>
            </thead>
            <tbody>
              {neededList.map((itm, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "6px", color: "#000" }}>
                    {isValidUrl(itm.LINK) ? (
                      <a
                        href={itm.LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "underline",
                          color: "blue",
                        }}
                      >
                        {itm.ITEM}
                      </a>
                    ) : (
                      <span>{itm.ITEM}</span>
                    )}
                  </td>
                  <td style={{ padding: "6px" }}>
                    <input
                      type="number"
                      min="1"
                      value={itm.QUANTITY}
                      onChange={(e) =>
                        handleUpdateNeededQuantity(
                          idx,
                          parseInt(e.target.value, 10) || 1
                        )
                      }
                      style={{
                        width: "60px",
                        backgroundColor: "#fff",
                        color: "#000",
                        border: "1px solid #000",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "6px",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => handleRemoveNeededItem(idx)}
                      style={{
                        backgroundColor: "#fff",
                        color: "#000",
                        border: "1px solid #000",
                        cursor: "pointer",
                      }}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: "1rem", color: "#000", fontWeight: "bold" }}>
        <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>Yellow (Mandatory) unchecked: {moNotGreenCounts.yellowNotGreen}</li>
          <li>White (Optional) unchecked: {moNotGreenCounts.whiteNotGreen}</li>
          <li>Green (SOFG2 recs) unchecked: {moNotGreenCounts.greenNotGreen}</li>
        </ul>
      </div>

      <Link
        to="/"
        style={{
          display: "block",
          marginTop: "1.5rem",
          color: "blue",
          fontWeight: "bold",
        }}
      >
        Return to Main Page
      </Link>
    </div>
  );
};

export default CoursePage;

