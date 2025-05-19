# PowerShell script to run all tests for the Bitzomax v3 project
Write-Host "Starting Bitzomax v3 test suite" -ForegroundColor Cyan

# Create a directory for test reports
New-Item -ItemType Directory -Path "test-reports" -Force | Out-Null

# Run backend tests
Write-Host "---------------------------------------------------" -ForegroundColor Cyan
Write-Host "Running backend tests..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------" -ForegroundColor Cyan
Set-Location -Path "backend"
./mvnw.cmd clean test

# Check if tests passed
$BACKEND_EXIT_CODE = $LASTEXITCODE
if ($BACKEND_EXIT_CODE -eq 0) {
  Write-Host "✅ Backend tests passed!" -ForegroundColor Green
} else {
  Write-Host "❌ Backend tests failed with exit code $BACKEND_EXIT_CODE" -ForegroundColor Red
}

# Save test reports
if (Test-Path "target/surefire-reports") {
  Copy-Item -Path "target/surefire-reports" -Destination "../test-reports/backend" -Recurse -Force
}

# Return to project root
Set-Location -Path ".."

# Run frontend tests
Write-Host "---------------------------------------------------" -ForegroundColor Cyan
Write-Host "Running frontend tests..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------" -ForegroundColor Cyan
Set-Location -Path "bitzomax-app"
npm test -- --no-watch --browsers=ChromeHeadless

# Check if tests passed
$FRONTEND_EXIT_CODE = $LASTEXITCODE
if ($FRONTEND_EXIT_CODE -eq 0) {
  Write-Host "✅ Frontend tests passed!" -ForegroundColor Green
} else {
  Write-Host "❌ Frontend tests failed with exit code $FRONTEND_EXIT_CODE" -ForegroundColor Red
}

# Save test reports
if (Test-Path "coverage") {
  Copy-Item -Path "coverage" -Destination "../test-reports/frontend" -Recurse -Force
}

# Return to project root
Set-Location -Path ".."

# Run e2e tests if available
Write-Host "---------------------------------------------------" -ForegroundColor Cyan
Write-Host "Running E2E tests..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------" -ForegroundColor Cyan
if (Test-Path "bitzomax-app/cypress") {
  Set-Location -Path "bitzomax-app"
  npm run e2e:headless
  $E2E_EXIT_CODE = $LASTEXITCODE
  if ($E2E_EXIT_CODE -ne 0) {
    Write-Host "❌ E2E tests failed with exit code $E2E_EXIT_CODE" -ForegroundColor Red
  }
  
  # Save E2E test reports
  if (Test-Path "cypress/screenshots") {
    Copy-Item -Path "cypress/screenshots" -Destination "../test-reports/e2e" -Recurse -Force
  }
  if (Test-Path "cypress/videos") {
    Copy-Item -Path "cypress/videos" -Destination "../test-reports/e2e" -Recurse -Force
  }
  Set-Location -Path ".."
} else {
  Write-Host "E2E tests not set up. Skipping..." -ForegroundColor Yellow
}

# Print summary
Write-Host "---------------------------------------------------" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "---------------------------------------------------" -ForegroundColor Cyan
if (($BACKEND_EXIT_CODE -eq 0) -and ($FRONTEND_EXIT_CODE -eq 0)) {
  Write-Host "✅ All tests completed successfully!" -ForegroundColor Green
  exit 0
} else {
  Write-Host "❌ Some tests failed. See reports for details." -ForegroundColor Red
  exit 1
}
