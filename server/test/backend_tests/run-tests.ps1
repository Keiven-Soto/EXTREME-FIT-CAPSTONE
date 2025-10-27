# run-tests.ps1 — run server Jest tests in PowerShell without changing ExecutionPolicy
# Usage: .\run-tests.ps1                 # runs all tests
#        .\run-tests.ps1 -- test/path.js  # passes args to jest

$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $here
Write-Host "[run-tests] Running tests from $here"

# Force unit-mode so mocks are injected by default
$env:RUN_INTEGRATION = 'false'

# Build command: use node to invoke jest binary to avoid npm/npx wrapper policies
$jestBin = Join-Path $here 'node_modules\jest\bin\jest.js'
if (-Not (Test-Path $jestBin)) {
  Write-Host "Jest binary not found at $jestBin — please run npm install first." -ForegroundColor Yellow
  exit 1
}

# Pass through any arguments
$argList = $args -join ' '
if ($argList) {
  Write-Host "$env:RUN_INTEGRATION -> node $jestBin $argList"
  node $jestBin $argList
} else {
  Write-Host "$env:RUN_INTEGRATION -> node $jestBin --runInBand"
  node $jestBin --runInBand
}
