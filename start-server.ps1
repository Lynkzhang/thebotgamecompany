$root = $PSScriptRoot
if (-not $env:TBC_HOME) { $env:TBC_HOME = Join-Path $root ".thebotcompany-demo" }
Set-Location $root
node src/server.js
