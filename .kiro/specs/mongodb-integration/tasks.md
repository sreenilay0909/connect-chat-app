# Implementation Plan: MongoDB Integration

## Overview

This implementation plan breaks down the MongoDB integration into discrete coding tasks. The approach follows a bottom-up strategy: first establishing the backend infrastructure (database connection, models, API), then updating the frontend to use the backend, and finally implementing data migration. Each task builds incrementally to ensure the system remains functional throughout development.

## Tasks

- [x] 1. Set up backend project structure and dependencies
  - Create `backend` directory in project root
  - Initialize Node.js project with `npm init`
  - Install dependencies: express, mongodb, dotenv, cors, typescript, @types/node, @types/express, @types/cors
  - Configure TypeScript with tsconfig.json (target: ES2020, module: commonjs, outDir: dist)
  - Create directory structure: src/models, src/controllers, src/routes, src/config
  - Add build and dev scripts to package.json
  - _Requirements: 1.6, 7.1, 7.2_

- [x] 2. Implement database connection module
  - [x] 2.1 Create database connection class in src/config/db.ts
    - Implement connect() method with connection pooling (min: 5, max: 20)
    - Implement retry logic (5 attempts, 10s interval)
    - Implement graceful shutdown with disconnect() method
    - Export getDb() function for accessing database instance
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 2.2 Write property test for connection string validation
    - **Property 1: Connection String Validation**
    - **Validates: Requirements 1.5**

  - [ ]* 2.3 Write unit tests for database connection module
    - Test successful connection
    - Test connection failure and retry logic
    - Test graceful shutdown
    - _Requirements: 1.1, 1.2, 1.3_


- [x] 3. Implement User model and validation
  - [x] 3.1 Create User model in src/models/User.ts
    - Implement createUser() method with ObjectId generation
    - Implement findUserByEmail() method
    - Implement getAllUsers() method
    - Implement updateUser() method
    - Implement updateLastSeen() method
    - Add helper to transform MongoDB _id to id for frontend
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_

  - [x] 3.2 Create MongoDB schema validation for User collection
    - Define validation rules for username (required, string, 3-50 chars)
    - Define validation rules for email (required, string, email format, unique index)
    - Define validation rules for avatar (required, string, URL format)
    - Define validation rules for status (required, string, max 200 chars)
    - Define validation rules for lastSeen (required, number)
    - _Requirements: 5.1, 5.2, 5.3, 2.4_

  - [ ]* 3.3 Write property test for user registration round trip
    - **Property 2: User Registration Creates Valid Documents**
    - **Property 11: User Endpoint Round Trip**
    - **Validates: Requirements 2.1, 2.2, 2.6, 4.1, 4.2**

  - [ ]* 3.4 Write property test for duplicate email prevention
    - **Property 3: Duplicate Email Prevention**
    - **Validates: Requirements 2.3, 10.4**

  - [ ]* 3.5 Write property test for user profile updates
    - **Property 4: User Profile Updates Persist**
    - **Validates: Requirements 2.5**

  - [ ]* 3.6 Write property test for lastSeen timestamp updates
    - **Property 5: LastSeen Timestamp Updates**
    - **Validates: Requirements 2.7**

  - [ ]* 3.7 Write property test for user validation enforcement
    - **Property 14: User Validation Enforcement**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.7**


- [x] 4. Implement Message model and validation
  - [x] 4.1 Create Message model in src/models/Message.ts
    - Implement createMessage() method with ObjectId generation
    - Implement getMessagesBetweenUsers() method with bidirectional query
    - Implement updateMessageStatus() method
    - Implement checkDuplicateMessage() method
    - Add query limit of 500 messages
    - Add helper to transform MongoDB _id to id for frontend
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 6.5, 10.5_

  - [x] 4.2 Create MongoDB schema validation for Message collection
    - Define validation rules for senderId (required, string)
    - Define validation rules for receiverId (required, string)
    - Define validation rules for text (optional, string, max 5000 chars)
    - Define validation rules for imageUrl (optional, string, URL format)
    - Define validation rules for type (required, enum: ['text', 'image'])
    - Define validation rules for timestamp (required, number)
    - Define validation rules for status (required, enum: ['sent', 'delivered', 'read'])
    - _Requirements: 5.4, 5.5, 5.6, 3.3_

  - [x] 4.3 Create database indexes for Message collection
    - Create compound index on (senderId, receiverId, timestamp)
    - Create compound index on (receiverId, senderId, timestamp)
    - _Requirements: 6.1, 6.2_

  - [ ]* 4.4 Write property test for message creation round trip
    - **Property 6: Message Creation Completeness**
    - **Property 12: Message Endpoint Round Trip**
    - **Validates: Requirements 3.1, 3.2, 3.3, 4.3, 4.4**

  - [ ]* 4.5 Write property test for bidirectional message retrieval
    - **Property 7: Bidirectional Message Retrieval**
    - **Validates: Requirements 3.4**

  - [ ]* 4.6 Write property test for message chronological ordering
    - **Property 8: Message Chronological Ordering**
    - **Validates: Requirements 3.5**

  - [ ]* 4.7 Write property test for message status updates
    - **Property 9: Message Status Updates Persist**
    - **Validates: Requirements 3.6**

  - [ ]* 4.8 Write property test for message type support
    - **Property 10: Message Type Support**
    - **Validates: Requirements 3.7**

  - [ ]* 4.9 Write property test for message validation enforcement
    - **Property 15: Message Validation Enforcement**
    - **Validates: Requirements 5.4, 5.5, 5.6, 5.7**

  - [ ]* 4.10 Write property test for message query result limit
    - **Property 16: Message Query Result Limit**
    - **Validates: Requirements 6.5**

  - [ ]* 4.11 Write property test for duplicate message prevention
    - **Property 22: Duplicate Message Prevention**
    - **Validates: Requirements 10.5**


- [x] 5. Checkpoint - Ensure database models work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement API controllers
  - [x] 6.1 Create User controller in src/controllers/userController.ts
    - Implement registerUser() handler (POST /users)
    - Implement getUsers() handler (GET /users)
    - Implement updateUser() handler (PUT /users/:id)
    - Add request validation for all endpoints
    - Add error handling with appropriate status codes (400, 500)
    - Update lastSeen on all user operations
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 2.7_

  - [x] 6.2 Create Message controller in src/controllers/messageController.ts
    - Implement sendMessage() handler (POST /messages)
    - Implement getMessages() handler (GET /messages?u1=&u2=)
    - Implement updateMessageStatus() handler (PUT /messages/:id)
    - Add request validation for all endpoints
    - Add error handling with appropriate status codes (400, 500)
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [ ]* 6.3 Write property test for invalid data returns 400
    - **Property 13: Invalid Data Returns 400**
    - **Validates: Requirements 4.5**

  - [ ]* 6.4 Write unit tests for controller error handling
    - Test 400 responses for invalid data
    - Test 500 responses for database errors
    - _Requirements: 4.5, 4.6_


- [x] 7. Implement API routes and server setup
  - [x] 7.1 Create routes in src/routes/index.ts
    - Define POST /users route → userController.registerUser
    - Define GET /users route → userController.getUsers
    - Define PUT /users/:id route → userController.updateUser
    - Define POST /messages route → messageController.sendMessage
    - Define GET /messages route → messageController.getMessages
    - Define PUT /messages/:id route → messageController.updateMessageStatus
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.2 Create server entry point in src/server.ts
    - Load environment variables from .env file
    - Initialize Express app
    - Configure CORS middleware
    - Configure JSON body parser middleware
    - Add request logging middleware
    - Register API routes
    - Initialize database connection
    - Start server on configured port (default 3000)
    - Handle graceful shutdown (SIGINT, SIGTERM)
    - _Requirements: 4.7, 4.8, 7.1, 7.2, 7.3, 8.4_

  - [x] 7.3 Create environment configuration
    - Create .env.example file with MONGODB_URI and PORT
    - Add .env to .gitignore
    - Document environment variables in backend README
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 7.4 Write unit tests for server initialization
    - Test server starts successfully with valid config
    - Test server refuses to start without MONGODB_URI
    - Test CORS headers are present
    - Test JSON parsing works
    - _Requirements: 7.3, 4.7, 4.8_


- [x] 8. Implement logging and error handling
  - [x] 8.1 Create logging utility in src/utils/logger.ts
    - Implement log function with timestamp formatting
    - Implement credential redaction function
    - Add log levels (info, error, debug)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 7.5_

  - [x] 8.2 Add logging to database operations
    - Log successful database connections
    - Log database operation errors with details
    - Log connection retry attempts
    - Log timeout errors with 504 status
    - _Requirements: 8.1, 8.3, 8.5_

  - [x] 8.3 Add logging to API endpoints
    - Log all incoming requests (method, path, timestamp)
    - Log validation errors with invalid data
    - Ensure no credentials in logs
    - _Requirements: 8.2, 8.4, 7.5_

  - [ ]* 8.4 Write property test for credential redaction
    - **Property 17: Credential Redaction in Logs**
    - **Validates: Requirements 7.5**

  - [ ]* 8.5 Write property test for error logging completeness
    - **Property 18: Error Logging Completeness**
    - **Validates: Requirements 8.1**

  - [ ]* 8.6 Write property test for request logging completeness
    - **Property 19: Request Logging Completeness**
    - **Validates: Requirements 8.4**

- [x] 9. Checkpoint - Ensure backend API is fully functional
  - Ensure all tests pass, ask the user if questions arise.


- [x] 10. Update frontend ApiService for backend integration
  - [x] 10.1 Add backend detection to ApiService
    - Implement detectBackend() method that attempts connection on startup
    - Add connection status tracking (isConnected flag)
    - Update setBaseUrl() to support dynamic backend URL configuration
    - _Requirements: 9.3_

  - [x] 10.2 Update ApiService methods to use backend endpoints
    - Update registerUser() to POST to /users endpoint
    - Update getUniverse() to GET from /users endpoint
    - Update sendMessage() to POST to /messages endpoint
    - Update getMessages() to GET from /messages endpoint
    - Maintain localStorage fallback on backend failure
    - Implement 3-second timeout for all requests
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ]* 10.3 Write property test for frontend backend routing
    - **Property 20: Frontend Backend Routing**
    - **Validates: Requirements 9.1, 9.2**

  - [ ]* 10.4 Write unit tests for ApiService
    - Test backend detection
    - Test fallback to localStorage on timeout
    - Test fallback to localStorage on backend unavailable
    - _Requirements: 9.2, 9.3, 9.5_


- [ ] 11. Implement data migration from localStorage to backend
  - [ ] 11.1 Create migration utility in services/migration.ts
    - Implement checkForLocalData() to detect existing localStorage data
    - Implement migrateUsers() to upload users to backend
    - Implement migrateMessages() to upload messages to backend
    - Implement clearLocalData() to remove localStorage after successful migration
    - Add duplicate detection (skip existing users/messages)
    - Add migration summary logging (success, failed, skipped counts)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 11.2 Integrate migration into App.tsx
    - Call migration on first successful backend connection
    - Show migration status to user (optional UI notification)
    - Handle migration errors gracefully
    - _Requirements: 10.1, 10.2_

  - [ ]* 11.3 Write property test for localStorage migration completeness
    - **Property 21: LocalStorage Migration Completeness**
    - **Validates: Requirements 9.4, 10.2, 10.3**

  - [ ]* 11.4 Write unit tests for migration utility
    - Test migration with sample localStorage data
    - Test duplicate handling
    - Test partial migration failures
    - Test localStorage clearing after migration
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [ ] 12. Final checkpoint - End-to-end integration testing
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 13. Create deployment documentation
  - [ ] 13.1 Create backend README.md
    - Document installation steps
    - Document environment variables
    - Document API endpoints with examples
    - Document deployment to Render/Railway/Heroku
    - Document MongoDB Atlas setup
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ] 13.2 Update main project README.md
    - Add backend setup instructions
    - Add MongoDB integration overview
    - Add troubleshooting section
    - Document offline mode behavior
    - _Requirements: 9.2_

  - [ ] 13.3 Create deployment guide
    - Document frontend deployment (Vercel/Netlify)
    - Document backend deployment (Render/Railway)
    - Document MongoDB Atlas configuration
    - Document environment variable setup for production
    - _Requirements: 7.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Backend uses TypeScript for type safety and consistency with frontend
- MongoDB driver is used directly (no ORM) for simplicity and performance
