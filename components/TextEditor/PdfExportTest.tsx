"use client";

import React from "react";
import DownloadPDF from "./DownloadPDF";

const PdfExportTest: React.FC = () => {
  // Test HTML content with headings and alignment
  const testHtmlContent = `
    <h1>Main Heading</h1>
    <h2>Sub Heading</h2>
    <p>This is a regular paragraph with no alignment.</p>
    <p style="text-align: center;">This is a centered paragraph.</p>
    <p style="text-align: right;">This is a right-aligned paragraph.</p>
    <p style="text-align: justify;">This is a justified paragraph that should span multiple lines to demonstrate the justification effect properly.</p>
    <ul>
      <li>First list item</li>
      <li>Second list item</li>
      <li>Third list item</li>
    </ul>
    <strong>Bold text</strong>
    <em>Italic text</em>
    <u>Underlined text</u>
    <s>Strikethrough text</s>
  `;

  const handleTestPdfExport = async () => {
    try {
      await DownloadPDF(testHtmlContent, undefined, undefined, "test-export");
      alert("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error exporting PDF. Check console for details.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>PDF Export Test</h3>
      <button
        onClick={handleTestPdfExport}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Test PDF Export
      </button>
    </div>
  );
};

export default PdfExportTest;
