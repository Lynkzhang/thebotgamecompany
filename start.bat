@echo off
set "ROOT=%~dp0"
for %%I in ("%ROOT%..") do set "PARENT=%%~fI"
if not defined TBC_HOME set "TBC_HOME=%PARENT%\.thebotcompany-demo"

REM Clear proxy env vars that may be misconfigured system-wide
REM HTTP_PROXY/HTTPS_PROXY should be empty or a valid proxy URL, not a bypass pattern
set "HTTP_PROXY="
set "HTTPS_PROXY="
set "http_proxy="
set "https_proxy="

cd /d "%ROOT%"
node src/server.js
