/**
 * TikTok-Style Captions Generator
 *
 * Corner detection algorithm inspired by Pelicanizer's Rounded Text Generator
 * https://pelicanizer.com/newsites/roundtext/
 *
 * This implementation adds:
 * - Comprehensive documentation
 * - Automation support (Playwright/Puppeteer)
 * - Production-ready examples
 * - Open-source MIT license
 */

// Color schemes with proper contrast
const COLORS = [
  { name: "white", bg: "#ffffff", fg: "#000000", fgIfTransparent: "#ffffff" },
  { name: "black", bg: "#000000", fg: "#ffffff" },
  { name: "red", bg: "#ea403f", fg: "#ffffff" },
  { name: "orange", bg: "#ff933d", fg: "#ffffff" },
  { name: "yellow", bg: "#f2cd46", fg: "#000000" },
  { name: "lime-green", bg: "#78c25e", fg: "#ffffff" },
  { name: "teal", bg: "#77c8a6", fg: "#ffffff" },
  { name: "light-blue", bg: "#3496f0", fg: "#ffffff" },
  { name: "dark-blue", bg: "#2344b2", fg: "#ffffff" },
  { name: "violet", bg: "#5756d4", fg: "#ffffff" },
  { name: "pink", bg: "#f7d7e9", fg: "#000000" },
  { name: "brown", bg: "#a3895b", fg: "#ffffff" },
  { name: "dark-green", bg: "#32523b", fg: "#ffffff" },
  { name: "blue-gray", bg: "#2f688c", fg: "#ffffff" },
  { name: "light-gray", bg: "#92979e", fg: "#000000" },
  { name: "dark-gray", bg: "#333333", fg: "#ffffff" },
];

// Utility function to remove all child nodes
function removeAllChildNodes(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

// Get DOM elements
const boxEl = document.getElementById("box");
const alignInputsEl = document.getElementById("align-inputs");
const colorInputsEl = document.getElementById("color-inputs");
const transparentBackgroundCheckboxEl = document.getElementById("misc-transparent-bg");
const createButtonEl = document.getElementById("button-create");
const textEl = document.getElementById("text");
const customBgColorEl = document.getElementById("custom-bg-color");
const customFgColorEl = document.getElementById("custom-fg-color");

// Generate color input radio buttons
COLORS.forEach((color, i) => {
  const colorId = `color-${color.name}`;

  // Create radio input
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'color';
  input.id = colorId;
  input.checked = i === 0;
  input.dataset.bgColor = color.bg;
  input.dataset.fgColor = color.fg;
  input.dataset.fgColorIfTransparent = color.fgIfTransparent ?? color.fg;

  // Create label
  const label = document.createElement('label');
  label.className = 'color-label';
  label.htmlFor = colorId;
  label.style.backgroundColor = color.bg;

  colorInputsEl.appendChild(input);
  colorInputsEl.appendChild(label);
});

// Apply bg + fg colors to the box
function applyColors(bgColor, fgColor) {
  const isTransparent = transparentBackgroundCheckboxEl.checked;
  boxEl.style.setProperty("--bg-color", bgColor + (isTransparent ? "c0" : ""));
  boxEl.style.setProperty("--fg-color", fgColor);
  customBgColorEl.value = bgColor;
  customFgColorEl.value = fgColor;
}

// Preset swatch change handler
colorInputsEl.querySelectorAll('input[type=radio]').forEach(el => {
  el.onchange = evt => {
    const d = evt.target.dataset;
    const fg = transparentBackgroundCheckboxEl.checked ? d.fgColorIfTransparent : d.fgColor;
    applyColors(d.bgColor, fg);
  };

  if (el.checked) {
    el.dispatchEvent(new Event("change"));
  }
});

// Custom color picker handlers — deselect presets, apply immediately
customBgColorEl.oninput = () => {
  colorInputsEl.querySelectorAll('input[type=radio]').forEach(el => el.checked = false);
  boxEl.style.setProperty(
    "--bg-color",
    customBgColorEl.value + (transparentBackgroundCheckboxEl.checked ? "c0" : "")
  );
};

customFgColorEl.oninput = () => {
  colorInputsEl.querySelectorAll('input[type=radio]').forEach(el => el.checked = false);
  boxEl.style.setProperty("--fg-color", customFgColorEl.value);
};

// Alignment change handler
alignInputsEl.querySelectorAll('input[type=radio]').forEach(el => {
  el.onchange = evt => {
    boxEl.dataset.align = evt.target.value;
    textEl.style.textAlign = evt.target.value;
    textEl.dispatchEvent(new Event("change"));
  };

  // Trigger initial alignment
  if (el.checked) {
    el.dispatchEvent(new Event("change"));
  }
});

// Transparent background toggle
transparentBackgroundCheckboxEl.onchange = () => {
  const checked = colorInputsEl.querySelector('input[type=radio]:checked');
  if (checked) {
    checked.dispatchEvent(new Event("change"));
  } else {
    // Re-apply custom colors with updated transparency
    customBgColorEl.dispatchEvent(new Event("input"));
  }
};

// Core corner detection algorithm
function applyCornerDetection() {
  const align = boxEl.dataset.align;
  const lines = boxEl.querySelectorAll('.line');

  for (let i = 0; i < lines.length; i++) {
    const thisLine = lines[i];
    const lastLine = thisLine.previousElementSibling;

    if (!lastLine) continue;

    const thisStyle = getComputedStyle(thisLine);
    const thisBorderRadius = parseFloat(thisStyle.getPropertyValue("--border-radius")) * parseFloat(thisStyle.fontSize);
    const thisTolerance = align === "center" ? thisBorderRadius * 2 : thisBorderRadius;

    const lastStyle = getComputedStyle(lastLine);
    const lastBorderRadius = parseFloat(lastStyle.getPropertyValue("--border-radius")) * parseFloat(lastStyle.fontSize);
    const lastTolerance = align === "center" ? lastBorderRadius * 2 : lastBorderRadius;

    // Scenario 1: This line is narrower than last line
    if (lastLine.offsetWidth - lastTolerance >= thisLine.offsetWidth + thisTolerance) {
      // Round top corners (skip left for left-align, right for right-align)
      if (align !== "left") thisLine.classList.add("corner-tl");
      if (align !== "right") thisLine.classList.add("corner-tr");
    }
    // Scenario 2: This line is wider than last line
    else if (lastLine.offsetWidth + lastTolerance <= thisLine.offsetWidth - thisTolerance) {
      // Round bottom corners of previous line
      if (align !== "left") lastLine.classList.add("corner-bl");
      if (align !== "right") lastLine.classList.add("corner-br");
    }
    // Scenario 3: Lines are similar width - connect them seamlessly
    else {
      const width = Math.max(lastLine.offsetWidth, thisLine.offsetWidth);
      lastLine.classList.add("connect-b");
      lastLine.style.width = `${width}px`;
      thisLine.classList.add("connect-t");
      thisLine.style.width = `${width}px`;
    }
  }
}

// Text change handler - rebuilds caption boxes
textEl.onchange = evt => {
  removeAllChildNodes(boxEl);

  const lines = evt.target.value.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Support font scaling with pipe syntax: "Text|1.5"
    let [lineText, lineScale] = lines[i].split("|");
    lineScale = parseFloat(lineScale) || 1;

    // Create line element
    const lineEl = document.createElement("div");
    lineEl.className = "line";
    lineEl.textContent = lineText;
    lineEl.style.setProperty("--font-scale", lineScale);

    boxEl.appendChild(lineEl);
  }

  // Apply corner detection algorithm
  applyCornerDetection();
};

// Also trigger on keyup for live preview
textEl.onkeyup = textEl.onchange;

// Trigger initial render
textEl.dispatchEvent(new Event("change"));

// Export as PNG image
createButtonEl.onclick = async evt => {
  const scale = 4; // 4x resolution for high quality

  try {
    const dataUrl = await domtoimage.toPng(boxEl, {
      width: boxEl.offsetWidth * scale,
      height: boxEl.offsetHeight * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        margin: 0,
        width: `${boxEl.offsetWidth}px`,
        height: `${boxEl.offsetHeight}px`,
      },
    });

    // Convert to blob and open in new tab
    const file = await fetch(dataUrl);
    const blob = await file.blob();
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tiktok-caption.png';
    a.click();

    // Also open in new tab for preview
    window.open(url);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export image. Make sure dom-to-image library is loaded.');
  }
};

// Export the corner detection function for programmatic use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyCornerDetection, COLORS };
}
