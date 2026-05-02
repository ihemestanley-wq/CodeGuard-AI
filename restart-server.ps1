# Stop all node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait for processes to stop
Start-Sleep -Seconds 2

# Start the server
node src/web/server.js

# Made with Bob
