$root = $PSScriptRoot
if (-not $env:TBC_HOME) { $env:TBC_HOME = Join-Path (Split-Path $root -Parent) ".thebotcompany-demo" }

# Clear proxy env vars that may be misconfigured system-wide
$env:HTTP_PROXY = $null
$env:HTTPS_PROXY = $null
$env:http_proxy = $null
$env:https_proxy = $null

Set-Location $root
node src/server.js
