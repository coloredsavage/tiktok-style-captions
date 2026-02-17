/**
 * Example: Using TikTok-Style Captions with Playwright
 *
 * This demonstrates how to generate caption images programmatically
 * for automated video production workflows.
 *
 * Install: npm install playwright sharp
 */

const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const WIDTH = 768;
const HEIGHT = 1024; // 3:4 aspect ratio (portrait)

// Read the CSS and create an embeddable version
const styleCSS = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');

// Extract only the core caption styles (not demo page styles)
const coreStyles = styleCSS.split('/* ========================================')[0];

/**
 * Creates an HTML page with TikTok-style captions
 * @param {string} text - Multi-line text (separated by \n)
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @param {string} backgroundImageBase64 - Base64 encoded background image
 * @param {string} bgColor - Background color for captions
 * @param {string} fgColor - Text color
 * @param {string} align - Alignment: 'left', 'center', or 'right'
 * @returns {string} Complete HTML document
 */
function createHTML(text, width, height, backgroundImageBase64, bgColor = '#ffffff', fgColor = '#000000', align = 'left') {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  // Generate line HTML
  const lineHTML = lines.map(line => {
    const [lineText, scale] = line.split('|');
    const scaleValue = parseFloat(scale) || 1;
    return `<div class="line" style="--font-scale: ${scaleValue};">${escapeHTML(lineText)}</div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    ${coreStyles}

    /* Page-specific styles */
    body {
      margin: 0;
      padding: 0;
      width: ${width}px;
      height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: url('data:image/jpeg;base64,${backgroundImageBase64}') center/cover;
      position: relative;
      overflow: hidden;
    }

    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.15);
      z-index: 1;
    }

    #box {
      position: relative;
      z-index: 10;
      padding-left: ${align === 'left' ? '50px' : '0'};
      padding-right: ${align === 'right' ? '50px' : '0'};
    }
  </style>
</head>
<body>
  <div id="box" data-align="${align}" style="--bg-color: ${bgColor}; --fg-color: ${fgColor};">
    ${lineHTML}
  </div>

  <script>
    // Corner detection algorithm
    (function() {
      const boxEl = document.getElementById('box');
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

        // If this line is narrower than last line
        if (lastLine.offsetWidth - lastTolerance >= thisLine.offsetWidth + thisTolerance) {
          if (align !== "left") thisLine.classList.add("corner-tl");
          if (align !== "right") thisLine.classList.add("corner-tr");
        }
        // If this line is wider than last line
        else if (lastLine.offsetWidth + lastTolerance <= thisLine.offsetWidth - thisTolerance) {
          if (align !== "left") lastLine.classList.add("corner-bl");
          if (align !== "right") lastLine.classList.add("corner-br");
        }
        // If the lines are about equal - connect them
        else {
          const width = Math.max(lastLine.offsetWidth, thisLine.offsetWidth);
          lastLine.classList.add("connect-b");
          lastLine.style.width = width + 'px';
          thisLine.classList.add("connect-t");
          thisLine.style.width = width + 'px';
        }
      }
    })();
  </script>
</body>
</html>`;
}

function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Main function - generates caption images
 */
async function generateCaptions() {
  // Example slides
  const slides = [
    {
      text: 'What I wish I knew\nbefore 6 months of rejections',
      bgColor: '#ffffff',
      fgColor: '#000000',
      align: 'left'
    },
    {
      text: 'I applied to jobs every single day\ntailored CV, cover letters, follow ups\n0 interviews',
      bgColor: '#3496f0',
      fgColor: '#ffffff',
      align: 'left'
    },
    {
      text: 'Turns out I was not being rejected\nI was being filtered\n75% of resumes never reach a human',
      bgColor: '#ea403f',
      fgColor: '#ffffff',
      align: 'left'
    },
  ];

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  // Create output directory
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Process each slide
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];

    // Create a simple gradient background (you can replace with actual images)
    const backgroundBuffer = await createGradientBackground(WIDTH, HEIGHT);
    const backgroundBase64 = backgroundBuffer.toString('base64');

    // Create HTML page
    const html = createHTML(
      slide.text,
      WIDTH,
      HEIGHT,
      backgroundBase64,
      slide.bgColor,
      slide.fgColor,
      slide.align
    );

    // Render with Playwright
    const page = await context.newPage();
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    await page.setContent(html, { waitUntil: 'networkidle' });

    // Wait for corner detection to complete
    await page.waitForTimeout(100);

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT }
    });

    // Save to file
    const outputPath = path.join(outputDir, `caption-${i + 1}.jpg`);
    fs.writeFileSync(outputPath, screenshot);

    console.log(`✅ Generated: ${outputPath}`);

    await page.close();
  }

  await browser.close();
  console.log('\n🎉 All captions generated successfully!');
}

/**
 * Helper: Creates a simple gradient background
 */
async function createGradientBackground(width, height) {
  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toBuffer();
}

// Run the script
if (require.main === module) {
  generateCaptions().catch(console.error);
}

module.exports = { createHTML, generateCaptions };
