# Frontend Files Directory

This directory will contain the frontend HTML, CSS, and JavaScript files for the CodeGuard AI web interface.

## Planned Files

- `index.html` - Main web interface
- `styles.css` - Styling
- `app.js` - Frontend JavaScript logic

## Status

Frontend files will be created in the next subtask. The backend server infrastructure is now complete and ready to serve these files once they are created.

## Server Information

The Express server is configured to:
- Serve static files from this directory
- Provide API endpoints at `/api/analyze` and `/api/health`
- Handle security, rate limiting, and error handling

Start the server with:
```bash
npm run web
```

Or in development mode with auto-reload:
```bash
npm run dev