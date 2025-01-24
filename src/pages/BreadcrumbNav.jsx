// BreadcrumbNav.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * Given the entire data array and a current row ID,
 * build a list (array) of all ancestors up to the top (level=0 or no parent).
 * We'll store them from root -> ... -> current in ascending order.
 */
function buildBreadcrumbTrail(data, currentId) {
  const trail = [];
  let current = data.find((r) => r.id === currentId);

  // Climb up the "parent" chain until no more parents
  while (current) {
    // Insert at the front so the earliest ancestor ends up first
    trail.unshift(current);
    if (!current.parent) break; // no parent => top-level
    current = data.find((r) => r.id === current.parent);
  }

  return trail; 
}

const BreadcrumbNav = ({ data, row }) => {
  // Build the breadcrumb array
  const trail = buildBreadcrumbTrail(data, row.id);

  return (
    <nav style={{ marginBottom: "1rem" }}>
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;

        // If this is the last item, it's the current page (non-clickable)
        return (
          <span key={item.id}>
            {!isLast ? (
              <Link to={`/${item.id}`} style={{ textDecoration: "underline" }}>
                {item.title || item.id}
              </Link>
            ) : (
              <strong>{item.title || item.id}</strong>
            )}
            {/* Add a separator between segments */}
            {index < trail.length - 1 && " / "}
          </span>
        );
      })}
    </nav>
  );
};

export default BreadcrumbNav;
