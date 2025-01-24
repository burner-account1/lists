// import React from "react";
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDynamicGtag from "./useDynamicGtag";

const GenericPage = ({ data, row }) => {
  const location = useLocation();
  useDynamicGtag(row?.title, location.pathname);


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
