#!/bin/bash

# Script to run all tests for the Bitzomax v3 project
echo "Starting Bitzomax v3 test suite"

# Create a directory for test reports
mkdir -p test-reports

# Run backend tests
echo "---------------------------------------------------"
echo "Running backend tests..."
echo "---------------------------------------------------"
cd backend
./mvnw clean test

# Check if tests passed
BACKEND_EXIT_CODE=$?
if [ $BACKEND_EXIT_CODE -eq 0 ]; then
  echo "✅ Backend tests passed!"
else
  echo "❌ Backend tests failed with exit code $BACKEND_EXIT_CODE"
fi

# Save test reports
cp -r target/surefire-reports ../test-reports/backend

# Return to project root
cd ..

# Run frontend tests
echo "---------------------------------------------------"
echo "Running frontend tests..."
echo "---------------------------------------------------"
cd bitzomax-app
npm test -- --no-watch --browsers=ChromeHeadless

# Check if tests passed
FRONTEND_EXIT_CODE=$?
if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
  echo "✅ Frontend tests passed!"
else
  echo "❌ Frontend tests failed with exit code $FRONTEND_EXIT_CODE"
fi

# Save test reports
cp -r coverage ../test-reports/frontend

# Return to project root
cd ..

# Run e2e tests if available
echo "---------------------------------------------------"
echo "Running E2E tests..."
echo "---------------------------------------------------"
if [ -d "bitzomax-app/cypress" ]; then
  cd bitzomax-app
  npm run e2e:headless || echo "❌ E2E tests failed"
  # Save E2E test reports
  cp -r cypress/screenshots ../test-reports/e2e || true
  cp -r cypress/videos ../test-reports/e2e || true
  cd ..
else
  echo "E2E tests not set up. Skipping..."
fi

# Print summary
echo "---------------------------------------------------"
echo "Test Summary"
echo "---------------------------------------------------"
if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
  echo "✅ All tests completed successfully!"
  exit 0
else
  echo "❌ Some tests failed. See reports for details."
  exit 1
fi
