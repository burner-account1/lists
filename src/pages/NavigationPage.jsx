import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";
import useDynamicGtag from "./useDynamicGtag";

// Subdued, transparent blue link style
const linkStyle = {
  textDecoration: "none",
  color: "rgba(80, 120, 207, 0.85)", // subdued, semi-transparent blue
  fontWeight: "bold",
};

const NavigationPage = ({ data, row }) => {
  const location = useLocation();
  useDynamicGtag(row?.title, location.pathname);


  // Find immediate children
  const childPages = data.filter((r) => r.parent === row.id);

  return (
    <div style={{ padding: "1rem" }}>
      {/* 1) Breadcrumb */}
      <BreadcrumbNav data={data} row={row} />

      {/* 2) Current Page Title & optional message */}
      <h1>{row.title}</h1>
      {row.message && <p>{row.message}</p>}

      {/* 3) List of child links */}
      {childPages.length === 0 ? (
        <p>No sub-pages found.</p>
      ) : (
        <ul>
          {childPages.map((child) => {
            if (child.pageType === "external") {
              // External link => open in new tab, same style
              return (
                <li key={child.id}>
                  <a
                    href={child.externalURL}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(child.externalURL, "_blank", "noopener,noreferrer");
                    }}
                    style={linkStyle}
                  >
                    {child.title || child.id}
                  </a>
                </li>
              );
            } else {
              // Normal or navigation page => use <Link>
              return (
                <li key={child.id}>
                  <Link to={`/${child.id}`} style={linkStyle}>
                    {child.title || child.id}
                  </Link>
                </li>
              );
            }
          })}
        </ul>
      )}
    </div>
  );
};

export default NavigationPage;
