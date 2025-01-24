// useDynamicGtag.js
import { useEffect } from "react";

const GA_MEASUREMENT_ID = "AW-16837978710"; // replace with your ID

// 1. This function adds the Google Tag script if it's not already in the page
function addGtagScriptIfNeeded() {
  // Avoid re-injecting if script with this ID is present
  if (document.getElementById("ga-script")) return;

  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

// 2. This function adds the gtag initialization script if it's not already in the page
function addGtagInitIfNeeded() {
  if (document.getElementById("ga-init")) return;

  const script = document.createElement("script");
  script.id = "ga-init";
  script.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
  `;
  document.head.appendChild(script);
}

export default function useDynamicGtag(pageTitle, pagePath) {
  useEffect(() => {
    // Only run this in browser, not server-side
    if (typeof window === "undefined") return;

    // 1) Add the <script> if needed
    addGtagScriptIfNeeded();
    addGtagInitIfNeeded();

    // 2) Wait a tick for the script to load, then config
    //    In practice, the script loads quickly, but you might add an event listener if you want to be sure it's fully loaded first
    const doConfig = () => {
      if (window.gtag) {
        window.gtag("config", GA_MEASUREMENT_ID, {
          page_title: pageTitle || "Unknown Page",
          page_path: pagePath || window.location.pathname,
        });
      }
    };

    // We can do a small timeout or a script onload callback. For simplicity:
    setTimeout(doConfig, 300);

  }, [pageTitle, pagePath]);
}
