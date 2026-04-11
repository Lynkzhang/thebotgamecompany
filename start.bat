@echo off
set "ROOT=%~dp0"
if not defined TBC_HOME set "TBC_HOME=%ROOT%.thebotcompany-demo"
cd /d "%ROOT%"
node src/server.js
