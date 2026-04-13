@echo off
set "ROOT=%~dp0"
for %%I in ("%ROOT%..") do set "PARENT=%%~fI"
if not defined TBC_HOME set "TBC_HOME=%PARENT%\.thebotcompany-demo"
cd /d "%ROOT%"
node src/server.js
