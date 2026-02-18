import {
  pdf,
  Document,
  Page,
  StyleSheet,
  Text,
  Link,
  View,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 12,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottom: "1 solid #ccc",
    paddingBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 20,
    paddingBottom: 8,
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 16,
    paddingBottom: 8,
  },
  h3: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 14,
    paddingBottom: 8,
  },
  h4: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 12,
    paddingBottom: 8,
  },
  h5: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 10,
    paddingBottom: 6,
  },
  h6: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 10,
    paddingBottom: 6,
  },
  p: {
    marginBottom: 8,
    textAlign: "left",
  },
  ul: {
    marginBottom: 8,
  },
  ol: {
    marginBottom: 8,
  },
  li: {
    marginBottom: 4,
    marginLeft: 12,
  },
  table: {
    marginBottom: 12,
    marginTop: 8,
    width: "100%",
    border: "1 solid #000",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    border: "1 solid #000",
    padding: 6,
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: "column",
    justifyContent: "center",
  },
  tableHeader: {
    border: "1 solid #000",
    padding: 6,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: "column",
    justifyContent: "center",
  },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  underline: { textDecoration: "underline" },
  strikethrough: { textDecoration: "line-through" },
  a: {
    textDecoration: "underline",
    color: "blue",
    paddingLeft: 2,
    paddingRight: 2,
    marginLeft: 2,
  },
  left: { textAlign: "left" },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
  justify: { textAlign: "justify" },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "#ccc",
    paddingLeft: 10,
    marginLeft: 10,
    color: "#666",
  },
});

const getTextAlign = (el: HTMLElement) => {
  const style = el.getAttribute("style") || "";
  if (style.includes("text-align: center")) return styles.center;
  if (style.includes("text-align: right")) return styles.right;
  if (style.includes("text-align: justify")) return styles.justify;
  return null;
};

const getTextColor = (el: HTMLElement) => {
  const style = el.getAttribute("style") || "";
  const colorMatch = style.match(
    /color:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)|[a-zA-Z]+)/,
  );
  if (colorMatch) {
    return colorMatch[1];
  }
  return null;
};

const rgbToHex = (rgb: string) => {
  if (rgb.startsWith("#")) return rgb;
  if (rgb.startsWith("rgb")) {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, "0");
      const g = parseInt(match[2]).toString(16).padStart(2, "0");
      const b = parseInt(match[3]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
  }
  const colorMap: Record<string, string> = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#FF0000",
    green: "#00FF00",
    blue: "#0000FF",
    yellow: "#FFFF00",
    cyan: "#00FFFF",
    magenta: "#FF00FF",
    gray: "#808080",
    grey: "#808080",
    orange: "#FFA500",
    purple: "#800080",
    brown: "#A52A2A",
    pink: "#FFC0CB",
  };
  return colorMap[rgb.toLowerCase()] || "#000000";
};

const isBold = (el: HTMLElement) => {
  const style = el.getAttribute("style") || "";
  const tag = el.tagName.toLowerCase();
  return (
    style.includes("font-weight: bold") ||
    style.includes("font-weight: 700") ||
    tag === "strong" ||
    tag === "b"
  );
};

const isItalic = (el: HTMLElement) => {
  const style = el.getAttribute("style") || "";
  const tag = el.tagName.toLowerCase();
  return style.includes("font-style: italic") || tag === "em" || tag === "i";
};

const isUnderline = (el: HTMLElement) => {
  const style = el.getAttribute("style") || "";
  const tag = el.tagName.toLowerCase();
  return style.includes("text-decoration: underline") || tag === "u";
};

const isStrikethrough = (el: HTMLElement) => {
  const style = el.getAttribute("style") || "";
  const tag = el.tagName.toLowerCase();
  return (
    style.includes("text-decoration: line-through") ||
    tag === "s" ||
    tag === "del"
  );
};

export default async function DownloadPDF(
  htmlContent: string,
  logoUrl?: string | undefined,
  organizationName?: string | undefined,
  fileName?: string | undefined,
) {
  try {
    console.log("HTML Content:", logoUrl);
    const temp = document.createElement("div");
    temp.innerHTML = htmlContent;

    const elements = Array.from(temp.children);
    const docElements: React.ReactNode[] = [];

    // Add header with logo and organization name
    const headerElements: React.ReactNode[] = [];
    if (logoUrl || organizationName) {
      headerElements.push(
        <View key="header" style={styles.header}>
          {logoUrl && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
            <Image src={logoUrl} style={styles.logo} />
          )}
          <Text style={styles.organizationName}>{organizationName}</Text>
        </View>,
      );
    }

    elements.forEach((element, idx) => {
      const el = element as HTMLElement;
      const text = el.textContent?.trim();
      if (!text) return;

      const alignStyle = getTextAlign(el);
      const textColor = getTextColor(el);

      switch (el.tagName.toLowerCase()) {
        case "h1":
          {
            const textStyle = textColor
              ? {
                  ...styles.h1,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.h1, ...alignStyle }
                : styles.h1;
            docElements.push(
              <Text key={idx} style={textStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "h2":
          {
            const textStyle = textColor
              ? {
                  ...styles.h2,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.h2, ...alignStyle }
                : styles.h2;
            docElements.push(
              <Text key={idx} style={textStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "h3":
          {
            const textStyle = textColor
              ? {
                  ...styles.h3,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.h3, ...alignStyle }
                : styles.h3;
            docElements.push(
              <Text key={idx} style={textStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "h4":
          {
            const textStyle = textColor
              ? {
                  ...styles.h4,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.h4, ...alignStyle }
                : styles.h4;
            docElements.push(
              <Text key={idx} style={textStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "h5":
          {
            const textStyle = textColor
              ? {
                  ...styles.h5,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.h5, ...alignStyle }
                : styles.h5;
            docElements.push(
              <Text key={idx} style={textStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "h6":
          {
            const textStyle = textColor
              ? {
                  ...styles.h6,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.h6, ...alignStyle }
                : styles.h6;
            docElements.push(
              <Text key={idx} style={textStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "p":
        case "div":
          {
            const linkElements = el.querySelectorAll("a");
            const styledElements = el.querySelectorAll("*[style*='color']");
            if (
              linkElements.length > 0 ||
              styledElements.length > 0 ||
              textColor
            ) {
              const children: React.ReactNode[] = [];
              let keyCounter = 0;

              const processNode = (
                node: Node,
                parentStyles: Record<string, string> = {},
              ) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const childEl = node as HTMLElement;
                  const tag = childEl.tagName.toLowerCase();
                  const elementColor = getTextColor(childEl);
                  const hexColor = elementColor
                    ? rgbToHex(elementColor)
                    : parentStyles.color;
                  const elementStyles: Record<string, string> = {
                    ...parentStyles,
                  };
                  if (hexColor) {
                    elementStyles.color = hexColor;
                  }
                  if (isBold(childEl)) {
                    elementStyles.fontWeight = "bold";
                  }
                  if (isItalic(childEl)) {
                    elementStyles.fontStyle = "italic";
                  }
                  if (isUnderline(childEl)) {
                    elementStyles.textDecoration = "underline";
                  }
                  if (isStrikethrough(childEl)) {
                    elementStyles.textDecoration = "line-through";
                  }
                  if (tag === "a") {
                    const href = childEl.getAttribute("href");
                    const linkText = childEl.textContent?.trim() || "";
                    const linkColor = elementColor || "blue";
                    const finalColor = rgbToHex(linkColor);
                    const linkStyle = {
                      ...styles.a,
                      ...elementStyles,
                      color: finalColor,
                    };
                    if (href && linkText) {
                      children.push(
                        <Link
                          key={`link-${keyCounter++}`}
                          src={href}
                          style={linkStyle}
                        >
                          {linkText}
                        </Link>,
                      );
                    } else {
                      children.push(
                        <Text key={`text-${keyCounter++}`} style={linkStyle}>
                          {linkText}
                        </Text>,
                      );
                    }
                  } else if (tag === "br") {
                    children.push(
                      <Text key={`br-${keyCounter++}`}>{"\n"}</Text>,
                    );
                  } else {
                    if (childEl.childNodes.length > 0) {
                      childEl.childNodes.forEach((childNode) => {
                        processNode(childNode, elementStyles);
                      });
                    } else {
                      const childText = childEl.textContent?.trim() || "";
                      if (childText) {
                        children.push(
                          <Text
                            key={`text-${keyCounter++}`}
                            style={elementStyles}
                          >
                            {childText}
                          </Text>,
                        );
                      }
                    }
                  }
                } else if (node.nodeType === Node.TEXT_NODE) {
                  const nodeText = node.textContent?.trim() || "";
                  if (nodeText) {
                    const textStyles = { ...parentStyles };
                    if (textColor && !parentStyles.color) {
                      textStyles.color = rgbToHex(textColor);
                    }
                    children.push(
                      <Text key={`text-${keyCounter++}`} style={textStyles}>
                        {nodeText}
                      </Text>,
                    );
                  }
                }
              };

              el.childNodes.forEach((node) => {
                processNode(node);
              });

              const paragraphStyle = alignStyle
                ? { ...styles.p, ...alignStyle }
                : styles.p;
              docElements.push(
                <Text key={idx} style={paragraphStyle}>
                  {children}
                </Text>,
              );
            } else {
              const textStyle = textColor
                ? {
                    ...styles.p,
                    ...(alignStyle || {}),
                    color: rgbToHex(textColor),
                  }
                : alignStyle
                  ? { ...styles.p, ...alignStyle }
                  : styles.p;
              docElements.push(
                <Text key={idx} style={textStyle}>
                  {text}
                </Text>,
              );
            }
          }
          break;
        case "ul":
        case "ol":
          {
            const listItems = el.querySelectorAll(":scope > li");
            listItems.forEach((li, liIdx) => {
              const liEl = li as HTMLElement;
              const liAlignStyle = getTextAlign(liEl);
              const liTextColor = getTextColor(liEl);
              const liText = liEl.textContent?.trim();
              if (liText) {
                const textStyle = liTextColor
                  ? {
                      ...styles.li,
                      ...(liAlignStyle || {}),
                      color: rgbToHex(liTextColor),
                    }
                  : liAlignStyle
                    ? { ...styles.li, ...liAlignStyle }
                    : styles.li;
                docElements.push(
                  <Text key={`${idx}-${liIdx}`} style={textStyle}>
                    • {liText}
                  </Text>,
                );
              }
            });
          }
          break;
        case "li":
          {
            const liTextStyle = textColor
              ? {
                  ...styles.li,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.li, ...alignStyle }
                : styles.li;
            docElements.push(
              <Text key={idx} style={liTextStyle}>
                • {text}
              </Text>,
            );
          }
          break;
        case "a":
          {
            const href = el.getAttribute("href");
            const linkColor = getTextColor(el) || "blue";
            const hexColor = rgbToHex(linkColor);
            const linkStyle = alignStyle
              ? { ...styles.a, ...alignStyle, color: hexColor }
              : { ...styles.a, color: hexColor };
            docElements.push(
              <Link key={idx} src={href ?? undefined} style={linkStyle}>
                {text}
              </Link>,
            );
          }
          break;
        case "blockquote":
          {
            const blockquoteStyle = textColor
              ? {
                  ...styles.blockquote,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.blockquote, ...alignStyle }
                : styles.blockquote;
            docElements.push(
              <Text key={idx} style={blockquoteStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "b":
        case "strong":
          {
            const boldStyle = textColor
              ? {
                  ...styles.p,
                  ...styles.bold,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.p, ...styles.bold, ...alignStyle }
                : { ...styles.p, ...styles.bold };
            docElements.push(
              <Text key={idx} style={boldStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "i":
        case "em":
          {
            const italicStyle = textColor
              ? {
                  ...styles.p,
                  ...styles.italic,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.p, ...styles.italic, ...alignStyle }
                : { ...styles.p, ...styles.italic };
            docElements.push(
              <Text key={idx} style={italicStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "u":
          {
            const underlineStyle = textColor
              ? {
                  ...styles.p,
                  ...styles.underline,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.p, ...styles.underline, ...alignStyle }
                : { ...styles.p, ...styles.underline };
            docElements.push(
              <Text key={idx} style={underlineStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "s":
        case "del":
          {
            const strikethroughStyle = textColor
              ? {
                  ...styles.p,
                  ...styles.strikethrough,
                  ...(alignStyle || {}),
                  color: rgbToHex(textColor),
                }
              : alignStyle
                ? { ...styles.p, ...styles.strikethrough, ...alignStyle }
                : { ...styles.p, ...styles.strikethrough };
            docElements.push(
              <Text key={idx} style={strikethroughStyle}>
                {text}
              </Text>,
            );
          }
          break;
        case "table":
          {
            const tbody = el.querySelector("tbody");
            const tableRows = tbody
              ? tbody.querySelectorAll("tr")
              : el.querySelectorAll("tr");
            if (tableRows.length > 0) {
              const tableData: {
                isHeader: boolean;
                cells: { text: string; color: string | null }[];
              }[] = [];
              let maxColumnCount = 0;
              tableRows.forEach((row) => {
                const rowEl = row as HTMLElement;
                const cells = rowEl.querySelectorAll("td, th");
                maxColumnCount = Math.max(maxColumnCount, cells.length);
              });
              const columnWidth =
                maxColumnCount > 0 ? `${100 / maxColumnCount}%` : "25%";
              tableRows.forEach((row) => {
                const rowEl = row as HTMLElement;
                const headerCells = rowEl.querySelectorAll("th");
                const isHeaderRow = headerCells.length > 0;
                const cells = rowEl.querySelectorAll("td, th");
                const rowData: { text: string; color: string | null }[] = [];
                cells.forEach((cell) => {
                  const cellEl = cell as HTMLElement;
                  const cellText = cellEl.textContent?.trim() || "";
                  const cellColor = getTextColor(cellEl);
                  rowData.push({ text: cellText, color: cellColor });
                });
                if (rowData.length > 0) {
                  tableData.push({ isHeader: isHeaderRow, cells: rowData });
                }
              });
              const tableRowsElements: React.ReactNode[] = [];
              tableData.forEach((row, rowIndex) => {
                const cellElements: React.ReactNode[] = [];
                row.cells.forEach((cellData, cellIndex) => {
                  const cellStyle = row.isHeader
                    ? { ...styles.tableHeader, width: columnWidth }
                    : { ...styles.tableCell, width: columnWidth };
                  const textStyle = cellData.color
                    ? { color: rgbToHex(cellData.color) }
                    : {};
                  cellElements.push(
                    <View
                      key={`cell-${rowIndex}-${cellIndex}`}
                      style={cellStyle}
                    >
                      <Text style={textStyle}>{cellData.text}</Text>
                    </View>,
                  );
                });
                for (let i = row.cells.length; i < maxColumnCount; i++) {
                  const cellStyle = row.isHeader
                    ? { ...styles.tableHeader, width: columnWidth }
                    : { ...styles.tableCell, width: columnWidth };
                  cellElements.push(
                    <View key={`cell-${rowIndex}-${i}`} style={cellStyle}>
                      <Text></Text>
                    </View>,
                  );
                }
                tableRowsElements.push(
                  <View key={`row-${rowIndex}`} style={styles.tableRow}>
                    {cellElements}
                  </View>,
                );
              });
              docElements.push(
                <View key={idx} style={styles.table}>
                  {tableRowsElements}
                </View>,
              );
            }
          }
          break;
      }
    });

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          {headerElements}
          {docElements}
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName ?? "document"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("PDF downloaded successfully!");
  } catch (err) {
    console.error("PDF generation failed:", err);
  }
}
