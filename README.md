# TikTok-Style Captions

Create smooth, rounded text captions just like TikTok videos - with intelligent corner detection that automatically connects or rounds corners based on line widths.

> **Inspired by** [Pelicanizer's Rounded Text Generator](https://pelicanizer.com/newsites/roundtext/) - this open-source implementation adds automation support, comprehensive documentation, and examples for video creators.

[**🎨 Live Demo**](https://coloredsavage.github.io/tiktok-style-captions) <!-- Update with your GitHub username -->

![Demo Screenshot](demo.gif)

## Features

- **Smart Corner Detection** - Automatically determines which corners to round based on adjacent line widths
- **Multiple Alignments** - Left, center, or right-aligned text
- **16 Color Schemes** - Pre-configured color palettes with proper contrast
- **Transparent Backgrounds** - Optional transparency for overlaying on videos
- **Font Scaling** - Scale individual lines using the `|` syntax (e.g., "Big text|2")
- **High-Quality Export** - Export as PNG at 4x resolution
- **Zero Dependencies** - Pure HTML, CSS, and JavaScript (uses dom-to-image for export)

## How It Works

### The Algorithm

The magic is in how adjacent text lines connect. The algorithm compares line widths and applies different corner styles:

```
Line 1: "This is a longer line"     ┌─────────────────┐
Line 2: "Short"                      │  Longer line    │
                                     └──┐         ┌────┘
                                        │  Short  │
                                        └─────────┘
```

#### Three Scenarios:

1. **Narrower Line** - Gets rounded top corners
2. **Wider Line** - Previous line gets rounded bottom corners
3. **Similar Width** - Lines connect seamlessly with squared edges

### The CSS Trick

The smooth rounded corners use a clever technique with pseudo-elements:

```css
.line.corner-tl::before {
  content: "";
  position: absolute;
  left: -0.4em;
  width: 0.4em;
  height: 100%;
  border-top-right-radius: 0.2em;
  box-shadow: 0.2em -0.2em 0 var(--bg-color);
}
```

This creates a transparent box with a shadow that fills in the corner, creating the rounded cutout effect.

### Tolerance Calculation

Lines are considered "similar width" if they're within a tolerance based on the border radius:

```javascript
const borderRadius = parseFloat(style.getPropertyValue('--border-radius')) * parseFloat(style.fontSize);
const tolerance = align === 'center' ? borderRadius * 2 : borderRadius;
```

For center-aligned text, tolerance is doubled since corners can vary on both sides.

## Usage

### Basic HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="box" data-align="left">
    <div class="line">First line of text</div>
    <div class="line">Second line</div>
    <div class="line">Third line of text</div>
  </div>

  <script src="script.js"></script>
</body>
</html>
```

### Programmatic Usage

```javascript
// Update text dynamically
const textArea = document.getElementById('text');
textArea.value = "Line 1\nLine 2\nScaled line|1.5";
textArea.dispatchEvent(new Event('change'));

// Change alignment
document.getElementById('box').dataset.align = 'center';

// Change colors
document.getElementById('box').style.setProperty('--bg-color', '#3496f0');
document.getElementById('box').style.setProperty('--fg-color', '#ffffff');

// Export as image
const dataUrl = await domtoimage.toPng(boxEl, {
  width: boxEl.offsetWidth * 4,
  height: boxEl.offsetHeight * 4,
  style: {
    transform: 'scale(4)',
    transformOrigin: 'top left'
  }
});
```

### Font Scaling

Scale individual lines by adding `|scale` after the text:

```
Normal text
Bigger text|1.5
Huge text|2
Smaller text|0.8
```

## Integration with Playwright/Puppeteer

Perfect for automated video caption generation:

```javascript
const { chromium } = require('playwright');

const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    /* Include style.css contents here */
  </style>
</head>
<body>
  <div id="box" data-align="left">
    <div class="line">What I wish I knew</div>
    <div class="line">before 6 months of rejections</div>
  </div>
  <script>
    /* Include corner detection logic from script.js */
  </script>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 768, height: 1024 });
await page.setContent(html, { waitUntil: 'networkidle' });

// Wait for corner detection to complete
await page.waitForTimeout(100);

await page.screenshot({ path: 'caption.png' });
await browser.close();
```

### Important Notes for Automation:

1. **Include the full CSS** - All pseudo-element styles for corners
2. **Wait for layout** - Let the browser calculate widths before screenshot
3. **Use correct tolerance** - Border-radius based, not percentage
4. **Respect alignment** - Left-aligned skips left corners, right-aligned skips right corners

## File Structure

```
tiktok-style-captions/
├── index.html       # Demo page
├── style.css        # Core styling & corner algorithm
├── script.js        # Corner detection logic
├── README.md        # This file
└── LICENSE          # MIT License
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

Requires support for CSS custom properties and `fit-content` sizing.

## Credits

This project is **inspired by and builds upon** the excellent [Pelicanizer Rounded Text Generator](https://pelicanizer.com/newsites/roundtext/) by Pelicanizer.

The core corner detection algorithm and CSS technique for creating smooth rounded corners using pseudo-elements originates from their work. This open-source implementation:

- Documents the algorithm with detailed explanations
- Adds Playwright/Puppeteer integration for automation
- Provides production-ready examples for video creators
- Fixes common implementation issues
- Makes it easy to integrate into automated workflows

**Thank you to Pelicanizer for the original innovation!** 🙏

## License

MIT License - feel free to use in your projects!

## Contributing

Pull requests welcome! Please open an issue first to discuss major changes.

### Ideas for Contribution:

- [ ] Add more color schemes
- [ ] Support for gradients
- [ ] Animation presets
- [ ] Text stroke/outline option
- [ ] Custom font upload
- [ ] Mobile touch optimization
- [ ] Copy as CSS option
- [ ] Video overlay preview

---

**Made with ❤️ for the creator community**
