import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Papa from "papaparse";
import DynamicPage from "./pages/DynamicPage";
import "./App.css";

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQnARSkARuiT-loYhnqLfEQ5tl0CecRL39x1fsg2T1y56xLMjpoz8JauaUHa7rIUlQD09UVF3MAMECt/pub?output=tsv'
//"https://docs.google.com/spreadsheets/d/e/2PACX-1vRXx2CY11j1W_58K9CQY7esUJQTKQvAZvvYGgtYKMuohktvG70TQQAp23sM0zZbIIlT1ZF3-fDAZgAQ/pub?output=tsv";

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
          {/* Redirect "/" to "/branches" */}
          <Route path="/" element={<Navigate to="/branches" replace />} />
          {/* Catch-all dynamic route */}
          <Route path="/:pageId/*" element={<DynamicPage data={data} />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
