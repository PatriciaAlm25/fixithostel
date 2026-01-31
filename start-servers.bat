@echo off
echo Killing all node processes...
taskkill /im node.exe /f 2>nul
timeout /t 2 /nobreak
echo.
echo Starting backend server...
start "Backend" cmd /k "cd /d c:\Users\patri\Downloads\FixIt\ Hostel\ ^(5^)\FixIt\ Hostel\backend && node server.js"
timeout /t 3 /nobreak
echo.
echo Starting frontend server...
start "Frontend" cmd /k "cd /d c:\Users\patri\Downloads\FixIt\ Hostel\ ^(5^)\FixIt\ Hostel && npm run dev"
timeout /t 3 /nobreak
echo.
echo Servers started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
