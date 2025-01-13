import React from "react";
import { useParams, useNavigate } from "react-router-dom";

import LandingPage from "./LandingPage";
import MOSPage from "./MOSPage";
import CoursePage from "./CoursePage";

// Optionally, if you want a custom page type:
// import MyCustomPage from "./MyCustomPage";

const DynamicPage = ({ data }) => {
  const { pageId } = useParams();  // the :pageId from the route
  const navigate = useNavigate();

  // 1) Find the matching row in your spreadsheet data by 'id'
  const row = data.find((r) => r.id === pageId);

  // 2) If no match, show a 404 or fallback
  if (!row) {
    return <div>Page not found.</div>;
  }

  // 3) Determine which component or action based on 'pageType'
  switch (row.pageType) {
    case "landing":
      // If you want to reuse your existing LandingPage for a 'landing' row
      return <LandingPage data={data} row={row} />;

    case "mos":
      // Reuse MOSPage
      return <MOSPage data={data} row={row} />;

    case "course":
      // Reuse CoursePage
      return <CoursePage data={data} row={row} />;

    case "external":
      // Immediately redirect to row.externalURL 
      // or open in new tab if you prefer
      window.location.href = row.externalURL;
      return null;

    case "myCustom":
      // A brand-new page type
      return <MyCustomPage data={data} row={row} />;

    default:
      // fallback if pageType is unrecognized
      return <div>{row.message || "No recognized pageType found."}</div>;
  }
};

export default DynamicPage;
