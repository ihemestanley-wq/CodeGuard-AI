# CodeGuard AI - Frontend Interface Guide

## Overview

The CodeGuard AI PR Comment Simulator provides a GitHub-inspired web interface for analyzing pull request diffs. The interface displays analysis results in a professional PR comment format with risk assessments, security findings, complexity issues, and performance concerns.

## Files Created

### 1. **index.html** (283 lines)
Main HTML structure with:
- GitHub-inspired header with CodeGuard AI branding
- Hero section with description
- Large textarea for diff input (12 rows)
- File upload option for .diff, .patch, .txt files
- "Analyze PR" button (disabled until content is provided)
- "Load Sample Diff" button for quick testing
- Loading state with animated spinner
- Results section (hidden initially, shown after analysis)
- Error message display area
- Collapsible findings sections
- Copy results button
- Responsive layout

### 2. **css/styles.css** (1003 lines)
Comprehensive GitHub-like styling with:
- CSS custom properties for GitHub color scheme
- Risk level colors (green/yellow/orange/red)
- Professional typography using system fonts
- Responsive design (mobile, tablet, desktop)
- PR comment card styling
- Severity badges (critical/high/medium/low)
- Loading spinner animation
- Smooth transitions and hover states
- Accessibility features (focus styles, keyboard navigation)
- Print styles

### 3. **js/app.js** (619 lines)
Client-side logic including:
- State management
- Form submission handler
- File upload with drag-and-drop support
- Fetch API integration with /api/analyze endpoint
- Response parsing and display
- GitHub PR comment formatting
- Collapsible sections
- Error handling
- Loading state management
- Copy to clipboard functionality
- Character counter
- Sample diff loader

## Features

### Input Methods
1. **Manual Paste**: Paste git diff output directly into the textarea
2. **File Upload**: Click to browse or drag-and-drop .diff files
3. **Sample Diff**: Load a pre-configured sample for testing

### Risk Assessment Display
- **Risk Score**: 0-100 scale with color coding
  - 0-30: GREEN (LOW)
  - 31-60: YELLOW (MEDIUM)
  - 61-80: ORANGE (HIGH)
  - 81-100: RED (CRITICAL)
- **Summary**: AI-generated description of the risk level
- **Statistics**: Files analyzed, total findings, risk score

### Findings Categories
1. **🔒 Security Issues**: Authentication, authorization, injection vulnerabilities
2. **🧩 Complexity Issues**: Code complexity, maintainability concerns
3. **⚡ Performance Concerns**: Performance bottlenecks, optimization opportunities

Each finding includes:
- Severity badge (critical/high/medium/low)
- Issue message
- File path (monospace font)
- Detailed description/recommendation

### User Experience Features
- **Collapsible Sections**: Click to expand/collapse finding categories
- **Character Counter**: Real-time character count for diff input
- **Loading State**: Animated spinner during analysis
- **Error Messages**: Clear error feedback with icons
- **Copy Results**: One-click copy to clipboard in markdown format
- **New Analysis**: Quick reset to start over
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Keyboard Navigation**: Full keyboard accessibility
- **Smooth Animations**: Fade-in effects and transitions

## Usage Instructions

### 1. Start the Server
```bash
node src/web/server.js
```
Server runs on http://localhost:3000

### 2. Access the Interface
Open your browser and navigate to:
```
http://localhost:3000
```

### 3. Analyze a PR
**Option A: Paste Diff**
1. Copy your git diff output
2. Paste into the textarea
3. Click "Analyze PR"

**Option B: Upload File**
1. Click "Choose file" or drag a .diff file
2. File content loads automatically
3. Click "Analyze PR"

**Option C: Use Sample**
1. Click "Load Sample Diff"
2. Sample diff loads into textarea
3. Click "Analyze PR"

### 4. Review Results
- View risk assessment at the top
- Expand/collapse finding sections
- Read detailed recommendations
- Copy results to clipboard if needed

### 5. Start New Analysis
- Click "New Analysis" button
- Or click "Clear" to reset input

## API Integration

### Endpoint
```
POST /api/analyze
```

### Request Format
```json
{
  "diff": "diff --git a/file.js b/file.js\n..."
}
```

### Response Format
```json
{
  "riskScore": 75,
  "riskLevel": "HIGH",
  "summary": "This PR has several issues...",
  "filesAnalyzed": 3,
  "security": [
    {
      "severity": "high",
      "message": "Potential SQL injection",
      "file": "src/database.js",
      "description": "User input is directly concatenated..."
    }
  ],
  "complexity": [...],
  "performance": [...]
}
```

## Customization

### Colors
Edit CSS custom properties in `styles.css`:
```css
:root {
  --color-risk-low: #1a7f37;
  --color-risk-medium: #bf8700;
  --color-risk-high: #d15704;
  --color-risk-critical: #cf222e;
}
```

### Risk Thresholds
Edit in `app.js`:
```javascript
function getRiskLevel(score) {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}
```

### Branding
Update logo and title in `index.html`:
```html
<div class="logo">
  <svg class="logo-icon">...</svg>
  <h1>Your Brand Name</h1>
</div>
```

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Accessibility

- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ Screen reader friendly (ARIA labels)
- ✅ Focus indicators
- ✅ Semantic HTML
- ✅ Color contrast (WCAG AA compliant)

## Performance

- Lazy loading of results
- Efficient DOM manipulation
- CSS animations (GPU accelerated)
- Minimal JavaScript bundle
- No external dependencies

## Security

- XSS protection (HTML escaping)
- CSRF protection (via backend)
- Rate limiting (via backend)
- File size validation (5MB max)
- File type validation (.diff, .patch, .txt)

## Troubleshooting

### Issue: "Analyze PR" button is disabled
**Solution**: Ensure diff content is not empty

### Issue: File upload not working
**Solution**: Check file extension (.diff, .patch, .txt) and size (<5MB)

### Issue: Results not displaying
**Solution**: Check browser console for errors, verify API endpoint is accessible

### Issue: Sample diff not loading
**Solution**: Ensure examples directory is served by the server

### Issue: Styles not loading
**Solution**: Check that css/styles.css exists and server is serving static files

## Development

### File Structure
```
src/web/public/
├── index.html          # Main HTML page
├── css/
│   └── styles.css      # All styles
├── js/
│   └── app.js          # Client-side logic
└── FRONTEND_GUIDE.md   # This file
```

### Testing Locally
1. Start server: `node src/web/server.js`
2. Open browser: `http://localhost:3000`
3. Test with sample diff
4. Test file upload
5. Test error handling
6. Test responsive design (resize browser)
7. Test keyboard navigation

### Adding New Features
1. Update HTML structure in `index.html`
2. Add styles in `styles.css`
3. Implement logic in `app.js`
4. Test thoroughly
5. Update this guide

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Export results as PDF
- [ ] Compare multiple PRs
- [ ] Historical analysis view
- [ ] Integration with GitHub API
- [ ] Real-time collaboration
- [ ] Custom rule configuration
- [ ] Diff syntax highlighting

## Support

For issues or questions:
- Check the main README.md
- Review DEMO.md for examples
- Check server logs for errors
- Verify API endpoint is working

## License

Same as CodeGuard AI project license.

---

**Made with ❤️ by Bob**