import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GenericPage = ({ data, row }) => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", "AW-16837978710", {
        page_title: row.title || "Untitled Page",
        page_path: location.pathname,
      });
    }
  }, [location, row]);

  return (
    <div>
      <h1>{row.title || "Untitled Page"}</h1>
      <p>{row.message || ""}</p>

      {/* If there's a known link or PDF, display a button */}
      {row.courseSheetUrl && (
        <button
          onClick={() =>
            window.open(row.courseSheetUrl, "_blank", "noopener,noreferrer")
          }
        >
          Open Sheet
        </button>
      )}

      {/* Another example: show all row fields */}
      <pre style={{ background: "#f0f0f0" }}>
        {JSON.stringify(row, null, 2)}
      </pre>
    </div>
  );
};

export default GenericPage;
