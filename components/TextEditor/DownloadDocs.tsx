import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

// Helper function to extract text alignment from style attribute
const getTextAlign = (style: string) => {
  if (style.includes("text-align: center")) return AlignmentType.CENTER;
  if (style.includes("text-align: right")) return AlignmentType.RIGHT;
  if (style.includes("text-align: justify")) return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
};

// Helper function to extract text color from style attribute
const getTextColor = (style: string) => {
  const colorMatch = style.match(
    /color:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|[a-zA-Z]+)/,
  );
  if (colorMatch) {
    const color = colorMatch[1];
    // Handle hex colors
    if (color.startsWith("#")) {
      // Convert 3-digit hex to 6-digit
      if (color.length === 4) {
        return color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
      }
      return color.substring(1); // Remove #
    }
    // Handle named colors - convert common ones to hex
    const colorMap: Record<string, string> = {
      black: "000000",
      white: "FFFFFF",
      red: "FF0000",
      green: "00FF00",
      blue: "0000FF",
      yellow: "FFFF00",
      cyan: "00FFFF",
      magenta: "FF00FF",
      gray: "808080",
      grey: "808080",
      orange: "FFA500",
      purple: "800080",
      brown: "A52A2A",
      pink: "FFC0CB",
    };
    return colorMap[color.toLowerCase()] || "000000";
  }
  return undefined;
};

// Helper function to extract font size from style attribute
const getFontSize = (style: string) => {
  const fontSizeMatch = style.match(/font-size:\s*(\d+(?:\.\d+)?)(px|pt|em|%)/);
  if (fontSizeMatch) {
    const value = parseFloat(fontSizeMatch[1]);
    const unit = fontSizeMatch[2];
    if (unit === "px") {
      return Math.round(value * 0.75 * 2);
    } else if (unit === "pt") {
      return Math.round(value * 2);
    } else if (unit === "em") {
      return Math.round(value * 12 * 2);
    } else if (unit === "%") {
      return Math.round((value / 100) * 12 * 2);
    }
  }
  return undefined;
};

// Helper function to check if element has bold styling
const isBold = (element: HTMLElement) => {
  const style = element.getAttribute("style") || "";
  const tag = element.tagName.toLowerCase();
  return (
    style.includes("font-weight: bold") ||
    style.includes("font-weight: 700") ||
    tag === "strong" ||
    tag === "b"
  );
};

// Helper function to check if element has italic styling
const isItalic = (element: HTMLElement) => {
  const style = element.getAttribute("style") || "";
  const tag = element.tagName.toLowerCase();
  return style.includes("font-style: italic") || tag === "em" || tag === "i";
};

// Helper function to check if element has underline styling
const isUnderline = (element: HTMLElement) => {
  const style = element.getAttribute("style") || "";
  const tag = element.tagName.toLowerCase();
  return style.includes("text-decoration: underline") || tag === "u";
};

// Helper function to check if element has strikethrough styling
const isStrikethrough = (element: HTMLElement) => {
  const style = element.getAttribute("style") || "";
  const tag = element.tagName.toLowerCase();
  return (
    style.includes("text-decoration: line-through") ||
    tag === "s" ||
    tag === "del"
  );
};

// Process table element
const processTable = (tableElement: HTMLTableElement) => {
  const rows: TableRow[] = [];

  // Handle tbody if it exists
  let tableRows = tableElement.querySelectorAll("tr");
  const tbody = tableElement.querySelector("tbody");
  if (tbody) {
    tableRows = tbody.querySelectorAll("tr");
  }

  tableRows.forEach((row) => {
    const rowEl = row as HTMLTableRowElement;
    const cells: TableCell[] = [];

    // Check if this row contains header cells
    const headerCells = rowEl.querySelectorAll("th");
    const isHeaderRow = headerCells.length > 0;

    const rowCells = rowEl.querySelectorAll("td, th");
    rowCells.forEach((cell) => {
      const cellEl = cell as HTMLTableCellElement;
      const cellStyle = cellEl.getAttribute("style") || "";
      const cellText = cellEl.textContent?.trim() || "";

      // Get cell styling
      const cellColor = getTextColor(cellStyle);
      const cellFontSize = getFontSize(cellStyle);

      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText,
                  bold: isHeaderRow,
                  color: cellColor,
                  size: cellFontSize,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: isHeaderRow ? { fill: "D3D3D3" } : undefined, // Light gray for headers
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          },
        }),
      );
    });

    if (cells.length > 0) {
      rows.push(
        new TableRow({
          children: cells,
        }),
      );
    }
  });

  if (rows.length > 0) {
    return new Table({
      rows: rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }

  return null;
};

// Process text content with nested styling
const processTextContent = (element: HTMLElement): TextRun[] => {
  const textRuns: TextRun[] = [];

  // If element has no children, process it directly
  if (element.childNodes.length === 0) {
    if (element.textContent?.trim()) {
      const style = element.getAttribute("style") || "";
      textRuns.push(
        new TextRun({
          text: element.textContent.trim(),
          bold: isBold(element),
          italics: isItalic(element),
          underline: isUnderline(element) ? {} : undefined,
          strike: isStrikethrough(element),
          color: getTextColor(style),
          size: getFontSize(style),
        }),
      );
    }
    return textRuns;
  }

  // Process child nodes
  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const textContent = child.textContent?.trim() || "";
      if (textContent) {
        textRuns.push(
          new TextRun({
            text: textContent,
          }),
        );
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childElement = child as HTMLElement;
      const childStyle = childElement.getAttribute("style") || "";

      // If child has nested elements, process them recursively
      if (childElement.childNodes.length > 0) {
        const nestedRuns = processTextContent(childElement);
        textRuns.push(...nestedRuns);
      } else {
        // Process leaf elements
        const textContent = childElement.textContent?.trim() || "";
        if (textContent) {
          textRuns.push(
            new TextRun({
              text: textContent,
              bold: isBold(childElement),
              italics: isItalic(childElement),
              underline: isUnderline(childElement) ? {} : undefined,
              strike: isStrikethrough(childElement),
              color: getTextColor(childStyle),
              size: getFontSize(childStyle),
            }),
          );
        }
      }
    }
  });

  return textRuns;
};

export default async function DownloadDocs(
  htmlContent: string,
  fileName = "document.docx",
) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const children: (Paragraph | Table)[] = [];

    // Process all direct children of body
    doc.body.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tag = element.tagName.toLowerCase();
        const style = element.getAttribute("style") || "";

        const alignment = getTextAlign(style);

        // Handle different element types
        if (
          tag === "h1" ||
          tag === "h2" ||
          tag === "h3" ||
          tag === "h4" ||
          tag === "h5" ||
          tag === "h6"
        ) {
          const level = parseInt(tag.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6;
          const headingLevels = [
            HeadingLevel.HEADING_1,
            HeadingLevel.HEADING_2,
            HeadingLevel.HEADING_3,
            HeadingLevel.HEADING_4,
            HeadingLevel.HEADING_5,
            HeadingLevel.HEADING_6,
          ];

          const baseSizes = [48, 42, 36, 28, 24, 20]; // Half-points

          // Process heading content properly
          const headingTextRuns = processTextContent(element);

          // If no text runs were created, create one with the element's text content
          if (headingTextRuns.length === 0 && element.textContent?.trim()) {
            headingTextRuns.push(
              new TextRun({
                text: element.textContent.trim(),
                bold: true,
                size: baseSizes[level - 1],
              }),
            );
          }

          children.push(
            new Paragraph({
              children:
                headingTextRuns.length > 0
                  ? headingTextRuns
                  : [new TextRun({ text: element.textContent?.trim() || "" })],
              alignment,
              heading: headingLevels[level - 1],
              spacing: { after: 240 },
            }),
          );
        } else if (tag === "p" || tag === "div") {
          const textRuns = processTextContent(element);
          if (textRuns.length > 0) {
            children.push(
              new Paragraph({
                children: textRuns,
                alignment,
                spacing: { after: 200 },
              }),
            );
          }
        } else if (tag === "ul" || tag === "ol") {
          element.querySelectorAll("li").forEach((li) => {
            const liText = li.textContent?.trim() || "";
            if (liText) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: liText,
                    }),
                  ],
                  bullet: { level: 0 },
                  alignment,
                  spacing: { after: 120 },
                }),
              );
            }
          });
        } else if (tag === "li") {
          const textRuns = processTextContent(element);
          if (textRuns.length > 0) {
            children.push(
              new Paragraph({
                children: textRuns,
                bullet: { level: 0 },
                alignment,
                spacing: { after: 120 },
              }),
            );
          }
        } else if (tag === "table") {
          const table = processTable(element as HTMLTableElement);
          if (table) {
            children.push(table);
            // Add spacing after table
            children.push(
              new Paragraph({
                children: [],
                spacing: { after: 200 },
              }),
            );
          }
        } else if (tag === "br") {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 120 },
            }),
          );
        } else {
          // Handle other elements
          const textRuns = processTextContent(element);
          if (textRuns.length > 0) {
            children.push(
              new Paragraph({
                children: textRuns,
                alignment,
                spacing: { after: 120 },
              }),
            );
          }
        }
      }
    });

    const docxDoc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
      styles: {
        default: {
          heading1: { run: { size: 48, bold: true } },
          heading2: { run: { size: 42, bold: true } },
          heading3: { run: { size: 36, bold: true } },
          heading4: { run: { size: 28, bold: true } },
          heading5: { run: { size: 24, bold: true } },
          heading6: { run: { size: 20, bold: true } },
        },
      },
    });

    const blob = await Packer.toBlob(docxDoc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ DOCX downloaded successfully!");
  } catch (err) {
    console.error("❌ DOCX generation failed:", err);
  }
}
