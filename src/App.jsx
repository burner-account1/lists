import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Papa from "papaparse";

import LandingPage from "./pages/LandingPage";
import DynamicPage from "./pages/DynamicPage";  // the new file
import "./App.css";

const SHEET_URL =
  // "https://docs.google.com/spreadsheets/d/e/2PACX-1vQnARSkARuiT-loYhnqLfEQ5tl0CecRL39x1fsg2T1y56xLMjpoz8JauaUHa7rIUlQD09UVF3MAMECt/pub?output=tsv"; //true
   'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9KDdc0RVUcMb76Dyl202v6t5DScSlhJV4XFfp69bV5ocKA_wCPHIhGrnU1hvwUm3Cx6WY2cjHfrbf/pub?output=tsv'; //test

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const parsed = Papa.parse(text, { header: true, delimiter: "\t" });
        setData(parsed.data);
      } catch (err) {
        console.error("Error fetching spreadsheet:", err);
      }
    };

    fetchData();
  }, []);

  if (!data.length) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      <Router>
        <Routes>
          {/*
            Optionally keep a top-level route for "/"
            that shows the first row or a separate landing page
          */}
          <Route path="/" element={<LandingPage data={data} />} />

          {/*
            Single catch-all dynamic route: 
            /:pageId (and subpaths if needed, e.g. /:pageId/*) 
          */}
          <Route path="/:pageId/*" element={<DynamicPage data={data} />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
