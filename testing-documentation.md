# Bitzomax v3 Testing Documentation

This document provides a summary of the implemented tests and instructions on how to run them.

## Implemented Tests

### Backend Tests

#### Service Layer Tests
1. **VideoServiceTest**
   - Tests for retrieving, creating, and updating videos
   - Tests for filtering by visibility
   - Tests for pagination and sorting

2. **UserServiceTest**
   - Tests for user profile management
   - Tests for video favoriting operations
   - Tests for like/unlike functionality
   - Tests for watch history tracking

3. **GenreServiceImplTest**
   - Tests for CRUD operations on genres
   - Tests for name-based searches

4. **SubscriptionServiceTest**
   - Tests for subscription status checking
   - Tests for subscription creation and cancellation

5. **VideoFixServiceTest**
   - Tests for fixing visibility of videos
   - Tests for forcing all videos to be visible

6. **FileStorageServiceTest**
   - Tests for storing video and thumbnail files
   - Tests for file path resolution
   - Tests for error handling

#### Controller Layer Tests
1. **VideoControllerTest**
   - Tests for CRUD endpoints
   - Tests for pagination and filtering
   - Tests for file upload handling

2. **UserControllerTest**
   - Tests for user profile endpoints
   - Tests for favorites and history management
   - Tests for like/unlike operations

3. **AdminControllerTest**
   - Tests for admin-specific operations
   - Tests for video visibility management
   - Tests for video conversion status updates

4. **AdminVideoControllerTest**
   - Tests for admin video upload
   - Tests for video management operations
   - Tests for pagination and filtering

#### Integration Tests
1. **BitzomaxIntegrationTest**
   - Application context loading test
   - Video service and repository integration tests
   - API endpoint accessibility tests

2. **VideoVisibilityFixE2ETest**
   - End-to-end tests for the video visibility fix workflow
   - Tests for video creation and retrieval
   - Tests for video update and deletion

### Frontend Tests

#### Service Tests
1. **VideoServiceSpec**
   - Tests for API interactions
   - Tests for error handling
   - Tests for video data transformation

2. **UserServiceSpec**
   - Tests for authentication and authorization
   - Tests for user preference management

3. **SubscriptionServiceSpec**
   - Tests for subscription status checks
   - Tests for subscription operations

#### Component Tests
1. **VideosComponentSpec**
   - Tests for video display and filtering
   - Tests for premium content handling

2. **VideoComponentSpec**
   - Tests for video player functionality
   - Tests for related video display

3. **HeaderComponentSpec**
   - Tests for navigation menu
   - Tests for login/logout functionality

## Running the Tests

### Backend Tests

#### Running All Backend Tests
Using Maven:

```powershell
cd backend
./mvnw test
```

#### Running Specific Tests
To run a specific test class:

```powershell
./mvnw test -Dtest=VideoServiceTest
```

To run a specific test method:

```powershell
./mvnw test -Dtest=VideoServiceTest#getAllVideos
```

#### Test Reports
Test reports are generated in the `target/surefire-reports` directory.

### Frontend Tests

#### Running All Frontend Tests
Using npm:

```powershell
cd bitzomax-app
npm test
```

#### Running Tests in Watch Mode
This mode automatically reruns tests when files change:

```powershell
npm test -- --watch
```

#### Running Specific Tests
To run a specific test file:

```powershell
npm test -- --include=src/app/core/services/video.service.spec.ts
```

#### Coverage Reports
Coverage reports are generated in the `coverage` directory.

### End-to-End Tests

#### Setting Up Cypress
To set up Cypress for end-to-end testing:

```powershell
cd bitzomax-app
npm install cypress --save-dev
```

#### Running E2E Tests
```powershell
npm run e2e
```

### Running All Tests with One Command
Use the provided PowerShell script to run all tests and generate a consolidated report:

```powershell
./run-tests.ps1
```

## Test Environment Setup

### Backend Test Environment
The backend tests use an H2 in-memory database configured through the `application-test.properties` file.

Key configurations:
- Database: H2 in-memory
- File storage: Temporary directories
- FFmpeg usage: Disabled

### Frontend Test Environment
Frontend tests use:
- Karma test runner
- Jasmine testing framework
- Chrome headless browser

## Continuous Integration

To integrate with CI/CD pipelines:

1. Add the test command to your workflow:
   ```yaml
   steps:
     - uses: actions/checkout@v3
     - name: Set up JDK
       uses: actions/setup-java@v3
       with:
         java-version: '17'
         distribution: 'adopt'
     - name: Run backend tests
       run: cd backend && ./mvnw test
     - name: Set up Node.js
       uses: actions/setup-node@v3
       with:
         node-version: '18'
     - name: Install dependencies
       run: cd bitzomax-app && npm install
     - name: Run frontend tests
       run: cd bitzomax-app && npm test -- --no-watch --browsers=ChromeHeadless
   ```

## Test Best Practices

1. Write independent tests that don't rely on other tests
2. Use descriptive test method names that explain what's being tested
3. Follow AAA pattern (Arrange, Act, Assert)
4. Prefer using test fixtures and factory methods for test data
5. Avoid testing implementation details
6. Use mocks and stubs for external dependencies
7. Aim for high code coverage, but prioritize valuable tests

## Troubleshooting Common Issues

1. **Tests failing due to database issues**
   - Check that H2 is configured correctly in `application-test.properties`
   - Ensure `@Transactional` is used for tests that modify data

2. **Frontend tests failing with timeout errors**
   - Increase timeout in Karma configuration
   - Check for asynchronous operations not being handled correctly

3. **E2E tests failing due to timing issues**
   - Use Cypress wait commands instead of fixed timeouts
   - Add retry logic for flaky tests
