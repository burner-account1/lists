import React from "react";

const GenericPage = ({ data, row }) => {
  // row has keys like: pageType, id, title, message, parent, level, courseSheetUrl, etc.

  return (
    <div>
      <h1>{row.title || "Untitled Page"}</h1>
      <p>{row.message || ""}</p>

      {/* If there's a known link or PDF, display a button */}
      {row.courseSheetUrl && (
        <button
          onClick={() => window.open(row.courseSheetUrl, "_blank", "noopener,noreferrer")}
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
