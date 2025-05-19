# Bitzomax End-to-End Tests

This file contains Cypress tests for end-to-end testing of the Bitzomax video streaming platform.

## Setup

1. Install Cypress:
   ```
   npm install --save-dev cypress
   ```

2. Add the following to package.json scripts:
   ```
   "e2e": "cypress open"
   ```

3. Create a `cypress.config.ts` file in the project root with the following content:
   ```typescript
   import { defineConfig } from 'cypress';

   export default defineConfig({
     e2e: {
       baseUrl: 'http://localhost:4200',
       supportFile: 'cypress/support/e2e.ts',
     },
   });
   ```

## Test Cases

These are the main end-to-end test cases that should be implemented:

### User Flow Tests

1. **Home Page Loading**
   - Navigate to the home page
   - Verify the header and footer are displayed
   - Verify featured videos section is displayed
   - Verify navigation menu is accessible

2. **Video Browsing**
   - Navigate to the videos page
   - Verify videos are displayed in a grid
   - Filter videos by category
   - Verify pagination works

3. **Video Playback**
   - Navigate to a video page
   - Verify video player loads
   - Play the video
   - Verify controls work (pause, volume, fullscreen)

4. **User Authentication**
   - Visit the login page
   - Login with valid credentials
   - Verify the user is logged in
   - Verify user-specific content is displayed

5. **Premium Content**
   - Attempt to access premium content without subscription
   - Verify subscription prompt is shown
   - Subscribe to premium
   - Verify premium content is accessible

6. **User Interactions**
   - Like a video
   - Add a video to favorites
   - Check that liked and favorited videos appear in user profile

### Admin Flow Tests

1. **Admin Dashboard**
   - Login as admin
   - Navigate to admin dashboard
   - Verify dashboard statistics are displayed

2. **Video Management**
   - Upload a new video
   - Edit an existing video
   - Delete a video
   - Verify changes are reflected

3. **User Management**
   - View user list
   - Modify user permissions
   - Verify changes are saved

## Implementation Example

Here's an example of how to implement the "Home Page Loading" test:

```typescript
describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the header', () => {
    cy.get('app-header').should('be.visible');
    cy.contains('Bitzomax').should('be.visible');
  });

  it('should display the featured videos section', () => {
    cy.get('.featured-videos').should('be.visible');
    cy.get('.video-card').should('have.length.gt', 0);
  });

  it('should navigate to videos page', () => {
    cy.contains('Videos').click();
    cy.url().should('include', '/videos');
    cy.get('.videos-grid').should('be.visible');
  });
});
```

## Running the Tests

To run the tests:

1. Start the Angular app:
   ```
   npm start
   ```

2. Start the backend server:
   ```
   cd backend
   mvn spring-boot:run
   ```

3. Run Cypress tests:
   ```
   npm run e2e
   ```
