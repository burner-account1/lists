// DynamicPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import NavigationPage from "./NavigationPage";
import CoursePage from "./CoursePage";
import GenericPage from "./GenericPage";

const DynamicPage = ({ data }) => {
  const { pageId } = useParams();
  const row = data.find((r) => r.id === pageId);

  if (!row) return <div>Page not found.</div>;

  // If it's a course
  if (row.pageType === "course") {
    return <CoursePage data={data} row={row} />;
  }
  // If it's normal navigation
  if (row.pageType === "navigation") {
    return <NavigationPage data={data} row={row} />;
  }
  // If it's myCustom or fallback
  if (row.pageType === "myCustom") {
    // ...
  }

  // fallback
  return <GenericPage data={data} row={row} />;
};

export default DynamicPage;
