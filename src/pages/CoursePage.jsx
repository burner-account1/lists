import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Papa from 'papaparse';

const CoursePage = ({ data }) => {
  const { courseId } = useParams();
  const [htmlMessage, setHtmlMessage] = useState("");

  // ---------- State ----------
  const [packingList, setPackingList] = useState([]);
  const [documentLink, setDocumentLink] = useState('');
  const [courseInfo, setCourseInfo] = useState({});

  // "Needed" items
  const [neededList, setNeededList] = useState([]);
  const [customNeededList, setCustomNeededList] = useState([]);
  const [buildCartProcessing, setBuildCartProcessing] = useState(false);

  // Desired quantities (for numeric selector)
  const [desiredQuantities, setDesiredQuantities] = useState({});

  // Color states for each row: "red", "yellow", or "green"
  const [colorStates, setColorStates] = useState([]);

  // Quick checkmark fade
  const [lastAddedIndex, setLastAddedIndex] = useState(null);
  const [showCheckmark, setShowCheckmark] = useState(false);

  // Count how many items aren't green
  const notGreenCount = colorStates.filter((c) => c !== 'green').length;

  // [NEW] Track if we've finished loading from localStorage
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // [NEW] Track which rows are expanded to show THOUGHTS
  const [expandedRows, setExpandedRows] = useState({});

  // ---------- 1) Fetch course data once ----------
  useEffect(() => {
    const courseRow = data.find((row) => row.id === courseId);

    if (courseRow) {
      setDocumentLink(courseRow.CoursePagePDF || '');
      setCourseInfo({
        title: courseRow.courseTitle || 'No Title Available',
        message: courseRow.message || 'No additional information available.',
      });
    }

    const fetchCourseData = async () => {
      try {
        if (!courseRow?.courseSheetUrl) {
          console.warn('No courseSheetUrl provided for this course');
          return;
        }
        const response = await fetch(courseRow.courseSheetUrl);
        const text = await response.text();
        const parsedData = Papa.parse(text, { header: true, delimiter: '\t' }).data;

        // We add a small step to ensure each item can hold a `crossedOff` property
        const itemsWithCross = parsedData.slice(1).map((itm) => ({
          ...itm,
          crossedOff: false,
        }));

        setPackingList(itemsWithCross);
      } catch (error) {
        console.error('Error fetching course data:', error);
      }
    };
    fetchCourseData();
  }, [courseId, data]);

  // ---------- 2) Load from localStorage (once per courseId) ----------
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
      const savedCustom = localStorage.getItem(`customNeededList_${courseId}`);
      if (savedCustom) {
        const parsedCustom = JSON.parse(savedCustom);
        if (Array.isArray(parsedCustom)) setCustomNeededList(parsedCustom);
      }
    } catch {}

    try {
      const savedQuantities = localStorage.getItem(`desiredQuantities_${courseId}`);
      if (savedQuantities) {
        const parsedQ = JSON.parse(savedQuantities);
        if (parsedQ && typeof parsedQ === 'object') setDesiredQuantities(parsedQ);
      }
    } catch {}

    setHasLoadedFromStorage(true);
  }, [courseId]);

  // ---------- 3) Save to localStorage whenever states change, AFTER load ----------
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
    localStorage.setItem(`customNeededList_${courseId}`, JSON.stringify(customNeededList));
  }, [customNeededList, courseId, hasLoadedFromStorage]);

  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    localStorage.setItem(`desiredQuantities_${courseId}`, JSON.stringify(desiredQuantities));
  }, [desiredQuantities, courseId, hasLoadedFromStorage]);

  // ---------- 4) Once packingList is loaded, default color states & desiredQuantities ----------
  useEffect(() => {
    if (packingList.length) {
      if (colorStates.length === 0) {
        setColorStates(Array(packingList.length).fill('red'));
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
      const current = updated[index] || 'red';
      if (current === 'red') {
        updated[index] = 'yellow';
      } else if (current === 'yellow') {
        updated[index] = 'green';
      } else {
        updated[index] = 'red';
      }
      return updated;
    });
  };

  const setRowGreenByIndex = (index) => {
    setColorStates((prev) => {
      const updated = [...prev];
      updated[index] = 'green';
      return updated;
    });
  };

  const setRowGreenByItem = (item) => {
    const foundIndex = packingList.findIndex(
      (p) => p.ITEM === item.ITEM && p.LINK === item.LINK
    );
    if (foundIndex !== -1) setRowGreenByIndex(foundIndex);
  };

  const handleQuantityChange = (index, newVal) => {
    setDesiredQuantities((prev) => ({
      ...prev,
      [index]: newVal,
    }));
  };

  // Add item to needed => color => yellow
  const handleAddToNeeded = (item, index) => {
    setColorStates((prev) => {
      const updated = [...prev];
      updated[index] = 'yellow';
      return updated;
    });

    const qty = parseInt(desiredQuantities[index], 10) || 1;
    const clonedItem = { ...item, QUANTITY: qty, crossedOff: false };

    if (item.Custom === 'T') {
      setCustomNeededList((prev) => [...prev, clonedItem]);
    } else {
      setNeededList((prev) => [...prev, clonedItem]);
    }

    setLastAddedIndex(index);
    setShowCheckmark(true);
    setTimeout(() => setShowCheckmark(false), 1000);
  };

  // Link click => cross off & color => green in needed lists
  const handleLinkClick = (listType, idx) => {
    if (listType === 'regular') {
      const clickedItem = neededList[idx];
      setNeededList((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, crossedOff: true } : it))
      );
      setRowGreenByItem(clickedItem);
    } else {
      const clickedItem = customNeededList[idx];
      setCustomNeededList((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, crossedOff: true } : it))
      );
      setRowGreenByItem(clickedItem);
    }
  };

  // Remove item from needed lists
  const handleRemoveNeededItem = (idx) => {
    const removedItem = neededList[idx];
    if (removedItem) {
      setRowGreenByItem(removedItem);
    }
    setNeededList((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleRemoveCustomItem = (idx) => {
    const removedItem = customNeededList[idx];
    if (removedItem) {
      setRowGreenByItem(removedItem);
    }
    setCustomNeededList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update item quantity in needed
  const handleUpdateNeededQuantity = (idx, newVal) => {
    setNeededList((prev) =>
      prev.map((itm, i) => (i === idx ? { ...itm, QUANTITY: newVal } : itm))
    );
  };
  const handleUpdateCustomQuantity = (idx, newVal) => {
    setCustomNeededList((prev) =>
      prev.map((itm, i) => (i === idx ? { ...itm, QUANTITY: newVal } : itm))
    );
  };

  // Checkbox toggles color => green if checked, else revert
  const handleCheckboxToggle = (item, index, isChecked) => {
    setColorStates((prev) => {
      const updated = [...prev];
      updated[index] = isChecked
        ? 'green'
        : neededList.includes(item)
        ? 'yellow'
        : 'red';
      return updated;
    });
  };

  // ---------- NEW: Click the item name => instantly "purchase" ----------
  const handleItemNameClick = (e, item, index) => {
    e.preventDefault(); // Stop the default <a> click
    // 1) Turn color => green
    setColorStates((prev) => {
      const updated = [...prev];
      updated[index] = 'green';
      return updated;
    });

    // 2) Add to needed (or custom) with crossedOff: true
    const qty = parseInt(desiredQuantities[index], 10) || 1;
    const clonedItem = { ...item, QUANTITY: qty, crossedOff: true };

    if (item.Custom === 'T') {
      setCustomNeededList((prev) => [...prev, clonedItem]);
    } else {
      setNeededList((prev) => [...prev, clonedItem]);
    }

    // 3) Mark top row as crossedOff too
    setPackingList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], crossedOff: true };
      return updated;
    });

    // 4) Open link in new tab
    window.open(item.LINK, '_blank', 'noopener,noreferrer');
  };

  // [NEW] Inline expand/collapse for THOUGHTS
  const toggleThoughts = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // ---------- Bulk checkout ----------
  const buildCart = () => {
    setBuildCartProcessing(true);

    const uncrossedItems = neededList.filter((item) => !item.crossedOff);
    if (uncrossedItems.length === 0) {
      alert('No uncrossed items to bulk checkout!');
      setBuildCartProcessing(false);
      return;
    }

    const itemsBatch = uncrossedItems.slice(0, 10);
    const baseUrl = 'https://www.amazon.com/gp/aws/cart/add.html';
    const urlParams = new URLSearchParams();

    itemsBatch.forEach((itm, idx) => {
      const paramIndex = idx + 1;
      urlParams.set(`ASIN.${paramIndex}`, itm.ASIN);
      urlParams.set(`Quantity.${paramIndex}`, itm.QUANTITY || 1);
      if (itm.OFFER_ID) {
        urlParams.set(`OfferListingId.${paramIndex}`, itm.OFFER_ID);
      }
    });

    urlParams.set('AssociateTag', 'ceprince-20');
    const finalUrl = `${baseUrl}?${urlParams.toString()}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');

    // Cross off these items
    const updatedNeeded = neededList.map((it) =>
      itemsBatch.includes(it) ? { ...it, crossedOff: true } : it
    );
    setNeededList(updatedNeeded);

    // Also color them green
    itemsBatch.forEach((itm) => setRowGreenByItem(itm));
    setBuildCartProcessing(false);
  };

  // ---------- Render ----------
  return (
    <div
      style={{
        backgroundColor: '#fff',
        color: '#000',
        minHeight: '100vh',
        padding: '1rem',
      }}
    >
      <Link
        to="/"
        style={{ display: 'block', marginTop: '1.5rem', color: 'blue', fontWeight: 'bold' }}
      >
        Return to Main Page
      </Link>

      <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#000' }}>
        Items not green: {notGreenCount}
      </div>

      <h1 style={{ color: '#000' }}>{courseInfo.title}</h1>
      <p style={{ color: '#000' }}>{courseInfo.message}</p>

      {documentLink && isValidUrl(documentLink) && (
        <button
          onClick={() => window.open(documentLink, '_blank', 'noopener,noreferrer')}
          style={{
            backgroundColor: '#fff',
            color: 'blue',
            border: '2px solid blue',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '1rem',
          }}
        >
          Download/Print Packing List
        </button>
      )}

      <div style={{ maxWidth: '100%', overflowX: 'auto', marginTop: '1rem' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '600px',
            backgroundColor: '#fff',
            color: '#000',
          }}
        >
          <thead
            style={{
              position: 'sticky',
              top: 0,
              background: '#f7f7f7',
              zIndex: 2,
              color: '#000',
            }}
          >
            <tr>
              <th style={{ width: '50px', padding: '6px' }} />
              <th style={{ textAlign: 'left', padding: '6px' }}>Item</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Quantity</th>
              <th style={{ padding: '6px' }} />
              <th style={{ textAlign: 'center', padding: '6px', color: '#000' }}>
                Add to Needed
              </th>
              <th style={{ textAlign: 'center', padding: '6px', color: '#000' }}>
                Check
              </th>
              {/* [NEW] Column for Thoughts icon/button? 
                  We'll actually place it in the same row as item, but you could 
                  also dedicate a column. For simplicity, we'll keep it in the same columns. */}
            </tr>
          </thead>
          <tbody>
            {packingList.map((item, index) => {
              const rowStyle = {};
              if (item['M/O'] === 'M') {
                rowStyle.backgroundColor = 'rgba(255, 255, 0, 0.5)';
                rowStyle.color = '#000';
              }

              const squareColor = colorStates[index] || 'red';
              const validLink = item.LINK && isValidUrl(item.LINK);

              // If item.crossedOff, we do a line-through
              const itemNameStyle = {
                textDecoration: item.crossedOff ? 'line-through' : 'none',
                color: '#000',
                position: 'relative',
              };

              // [NEW] We'll store item.THOUGHTS in a variable
              const hasThoughts = item.THOUGHTS && item.THOUGHTS.trim().length > 0;

              return (
                <React.Fragment key={index}>
                  <tr style={rowStyle}>
                    <td style={{ padding: 0, verticalAlign: 'top' }}>
                      <div
                        onClick={() => cycleColorAtIndex(index)}
                        style={{
                          backgroundColor: squareColor,
                          width: '100%',
                          minWidth: '60px',
                          minHeight: '60px',
                          cursor: 'pointer',
                        }}
                      />
                    </td>

                    {/* Item name: clickable if there's a valid link */}
                    <td style={{ padding: '8px', position: 'relative' }}>
                      {validLink ? (
                        <a
                          href={item.LINK}
                          onClick={(e) => handleItemNameClick(e, item, index)}
                          style={{
                            ...itemNameStyle,
                            color: 'blue', // highlight that it's clickable
                            cursor: 'pointer',
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.ITEM || 'No Data'}
                        </a>
                      ) : (
                        <span style={itemNameStyle}>{item.ITEM || 'No Data'}</span>
                      )}

                      {/* Checkmark fade effect */}
                      {showCheckmark && lastAddedIndex === index && (
                        <span
                          style={{
                            position: 'absolute',
                            left: '-20px',
                            color: 'green',
                            fontWeight: 'bold',
                            transition: 'opacity 1s',
                          }}
                        >
                          ✓
                        </span>
                      )}

                      {/* [NEW] If there's a THOUGHTS value, show a small button/icon */}
                      {hasThoughts && (
  <button
    onClick={() => toggleThoughts(index)}
    style={{
      marginLeft: '8px',
      backgroundColor: '#fff',
      border: '1px solid #007bff',     // primary-blue border
      borderRadius: '4px',
      color: '#007bff',
      padding: '4px 8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      // A little trick for a hover effect:
      transition: 'background-color 0.2s ease',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e6f0ff')}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
    title="Show/Hide Thoughts"
  >
    Context
  </button>
)}
                    </td>

                    <td style={{ padding: '8px', color: '#000' }}>
                      {item.QUANTITY || '0'}
                    </td>

                    <td style={{ padding: '8px' }}>
                      <input
                        type="number"
                        min="1"
                        value={desiredQuantities[index] || ''}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        style={{
                          width: '40px',
                          backgroundColor: '#fff',
                          color: '#000',
                          border: '1px solid #000',
                        }}
                      />
                    </td>

                    {/* Add to Needed button */}
                    <td style={{ textAlign: 'center', padding: '2px 2px' }}>
                      {validLink ? (
                        <button
                          onClick={() => handleAddToNeeded(item, index)}
                          style={{
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '1px solid #000',
                            padding: '5px 5px',
                            cursor: 'pointer',
                          }}
                        >
                          Add to Needed
                        </button>
                      ) : (
                        <span style={{ color: '#000' }}>No Link</span>
                      )}
                    </td>

                    {/* Checkbox => toggles green/revert */}
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      <input
                        type="checkbox"
                        style={{
                          width: '35px',
                          height: '35px',
                          backgroundColor: '#fff',
                          color: '#000',
                          accentColor: '#000',
                          border: '1px solid #000',
                        }}
                        checked={squareColor === 'green'}
                        onChange={(e) =>
                          handleCheckboxToggle(item, index, e.target.checked)
                        }
                      />
                    </td>
                  </tr>

                  {/* [NEW] If expandedRows[index], show another row with the THOUGHTS text */}
                  {hasThoughts && expandedRows[index] && (
                    <tr>
                      <td colSpan={6} style={{ backgroundColor: '#f9f9f9', padding: '10px' }}>
                        <strong>Context:</strong>
                        <div style={{ marginTop: '5px', color: '#333' }}>
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

      {/* Needed Items Section */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#000' }}>Needed Items</h3>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Cart Checkout (non-custom) */}
          <div style={{ flex: '1 1 300px', color: '#000' }}>
            <h4 style={{ color: '#000' }}>Cart Checkout</h4>
            {neededList.length === 0 ? (
              <p style={{ color: '#000' }}>No direct-cart items added.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ color: '#000' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Item</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Quantity</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Link</th>
                    <th style={{ width: '40px' }} />
                  </tr>
                </thead>
                <tbody>
                  {neededList.map((itm, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: '6px',
                          textDecoration: itm.crossedOff ? 'line-through' : 'none',
                          color: '#000',
                        }}
                      >
                        {itm.ITEM}
                      </td>
                      <td style={{ padding: '6px' }}>
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
                            width: '60px',
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '1px solid #000',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <a
                          href={itm.LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'underline', color: 'blue' }}
                          onClick={() => handleLinkClick('regular', idx)}
                        >
                          {itm.LINK}
                        </a>
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveNeededItem(idx)}
                          style={{
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '1px solid #000',
                            cursor: 'pointer',
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

          <button
            onClick={buildCart}
            disabled={buildCartProcessing || neededList.length === 0}
            style={{
              marginTop: '1.5rem',
              backgroundColor: '#fff',
              color: '#000',
              border: '1px solid #000',
              cursor: 'pointer',
              padding: '6px 10px',
              height: 'fit-content',
            }}
          >
            {buildCartProcessing ? 'Building...' : 'Bulk Checkout'}
          </button>

          {/* Custom items (direct checkout) */}
          <div style={{ flex: '1 1 300px', color: '#000' }}>
            <h4 style={{ color: '#000' }}>Direct Checkout Needed</h4>
            {customNeededList.length === 0 ? (
              <p style={{ color: '#000' }}>No direct-checkout items added.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ color: '#000' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Item</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Quantity</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Link</th>
                    <th style={{ width: '40px' }} />
                  </tr>
                </thead>
                <tbody>
                  {customNeededList.map((itm, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: '6px',
                          textDecoration: itm.crossedOff ? 'line-through' : 'none',
                          color: '#000',
                        }}
                      >
                        {itm.ITEM}
                      </td>
                      <td style={{ padding: '6px' }}>
                        <input
                          type="number"
                          min="1"
                          value={itm.QUANTITY}
                          onChange={(e) =>
                            handleUpdateCustomQuantity(
                              idx,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          style={{
                            width: '60px',
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '1px solid #000',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <a
                          href={itm.LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'underline', color: 'blue' }}
                          onClick={() => handleLinkClick('custom', idx)}
                        >
                          {itm.LINK}
                        </a>
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveCustomItem(idx)}
                          style={{
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '1px solid #000',
                            cursor: 'pointer',
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
        </div>
      </div>

      <div style={{ marginTop: '1rem', fontWeight: 'bold', color: '#000' }}>
        Items not green: {notGreenCount}
      </div>

      <Link
        to="/"
        style={{ display: 'block', marginTop: '1.5rem', color: 'blue', fontWeight: 'bold' }}
      >
        Return to Main Page
      </Link>
    </div>
  );
};

export default CoursePage;
