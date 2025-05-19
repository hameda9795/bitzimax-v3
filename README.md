# Bitzomax v3 Video Streaming Platform

A modern video streaming platform built with Spring Boot backend and Angular frontend.

## Project Overview

Bitzomax v3 is a comprehensive video streaming solution that allows users to:
- Browse and watch videos
- Upload their own content
- Subscribe to premium offerings
- Interact with videos (likes, favorites, watch history)
- Manage content (admin functionality)

## Architecture

### Backend
- Spring Boot 3.x
- Spring Security for authentication and authorization
- Spring Data JPA for database operations
- MySQL/PostgreSQL for production, H2 for testing
- RESTful API design

### Frontend
- Angular 16+
- Angular Material for UI components
- TailwindCSS for styling
- RxJS for reactive programming
- NgRx for state management

## Features

- Video upload and management
- Video playback with custom controls
- User authentication and profiles
- Premium subscription management
- Content categorization by genres
- Admin dashboard for content and user management
- Video processing and conversion

## Testing

### Test Coverage

Comprehensive testing has been implemented at multiple levels:

#### Backend Tests
- Unit tests for all service classes
- Controller tests for API endpoints
- Repository tests for data access
- Integration tests for component interactions
- End-to-end tests for critical workflows

#### Frontend Tests
- Service tests for API interactions
- Component tests for UI functionality
- End-to-end tests for user workflows

### Running Tests

To run backend tests:
```powershell
cd backend
./mvnw test
```

To run frontend tests:
```powershell
cd bitzomax-app
npm test
```

To run all tests with a single command:
```powershell
./run-tests.ps1
```

For more detailed testing information, see [testing documentation](../testing-documentation.md).

## Development Setup

### Prerequisites
- JDK 17+
- Node.js 18+
- npm 9+
- Maven 3.8+

### Backend Setup
1. Clone the repository
2. Navigate to the backend directory
3. Run `./mvnw spring-boot:run`
4. The server will start on http://localhost:8080

### Frontend Setup
1. Navigate to the bitzomax-app directory
2. Run `npm install`
3. Run `ng serve`
4. The application will be available at http://localhost:4200

## Deployment

### Backend Deployment
The backend can be deployed as a standalone JAR:
```
./mvnw clean package
java -jar target/bitzomax-v3.jar
```

### Frontend Deployment
Build the production version:
```
cd bitzomax-app
npm run build
```

The output will be in the `dist` directory, which can be deployed to any web server.

## Documentation

- [API Documentation](../api-docs.md)
- [Testing Documentation](../testing-documentation.md)
- [Test Plan](../test-plan.md)
- [E2E Tests](../e2e-tests.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the tests
5. Submit a pull request

## License

[MIT License](LICENSE)
