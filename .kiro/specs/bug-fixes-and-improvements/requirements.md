# Requirements Document

## Introduction

This document outlines the requirements for fixing critical bugs and non-functional features in the Connect chat application. The application currently has several issues including port mismatches, non-functional icons, and missing functionality that need to be addressed.

## Glossary

- **Frontend**: The React-based user interface running on Vite (port 5173)
- **Backend**: The Express.js server with MongoDB integration (port 3001)
- **API_Service**: The service layer that handles communication between Frontend and Backend
- **User**: A person using the Connect chat application
- **Icon**: A visual element (Font Awesome icon) that represents an action or feature
- **Port_Mismatch**: When the Frontend attempts to connect to a different port than the Backend is running on

## Requirements

### Requirement 1: Fix Backend Connection Port Mismatch

**User Story:** As a user, I want the application to connect to the backend successfully, so that I can use real-time messaging features with database persistence.

#### Acceptance Criteria

1. WHEN the Frontend initializes, THE API_Service SHALL use port 3001 to connect to the Backend
2. WHEN the Backend starts, THE Backend SHALL listen on port 3001 as configured in the environment file
3. WHEN the connection is established, THE Frontend SHALL display "Cloud Sync Active" status indicator
4. IF the Backend is unavailable, THEN THE Frontend SHALL fall back to localStorage and display "Offline / Local Only" status

### Requirement 2: Implement Video Call Functionality

**User Story:** As a user, I want to initiate video calls with my contacts, so that I can have face-to-face conversations.

#### Acceptance Criteria

1. WHEN a user clicks the video icon in the chat window header, THE System SHALL initiate a video call request
2. WHEN a video call is initiated, THE System SHALL display appropriate user feedback
3. WHEN the video icon is clicked, THE System SHALL provide a clear indication that the feature is being activated
4. IF video call functionality is not yet fully implemented, THEN THE System SHALL display a notification indicating the feature is coming soon

### Requirement 3: Implement Voice Call Functionality

**User Story:** As a user, I want to initiate voice calls with my contacts, so that I can have audio conversations.

#### Acceptance Criteria

1. WHEN a user clicks the phone icon in the chat window header, THE System SHALL initiate a voice call request
2. WHEN a voice call is initiated, THE System SHALL display appropriate user feedback
3. WHEN the phone icon is clicked, THE System SHALL provide a clear indication that the feature is being activated
4. IF voice call functionality is not yet fully implemented, THEN THE System SHALL display a notification indicating the feature is coming soon

### Requirement 4: Implement Voice Message Recording

**User Story:** As a user, I want to record and send voice messages when the input field is empty, so that I can communicate through audio when typing is inconvenient.

#### Acceptance Criteria

1. WHEN the input field is empty, THE System SHALL display a microphone icon in the send button
2. WHEN a user clicks the microphone icon, THE System SHALL request microphone permissions
3. WHEN microphone permissions are granted, THE System SHALL begin recording audio
4. WHEN recording is active, THE System SHALL provide visual feedback indicating recording status
5. WHEN a user stops recording, THE System SHALL save and send the voice message
6. IF microphone permissions are denied, THEN THE System SHALL display an error message
7. IF voice recording is not yet fully implemented, THEN THE System SHALL display a notification indicating the feature is coming soon

### Requirement 5: Improve User Experience with Icon Feedback

**User Story:** As a user, I want clear feedback when I interact with icons and buttons, so that I understand what actions are available and what is happening.

#### Acceptance Criteria

1. WHEN a user hovers over an interactive icon, THE System SHALL provide visual feedback
2. WHEN a user clicks a non-functional icon, THE System SHALL display a tooltip or notification
3. WHEN an icon represents a feature under development, THE System SHALL indicate this to the user
4. THE System SHALL ensure all interactive elements have appropriate cursor styles

### Requirement 6: Fix API Service Base URL Configuration

**User Story:** As a developer, I want the API service to use the correct default backend URL, so that the application works correctly in development mode without manual configuration.

#### Acceptance Criteria

1. WHEN the API_Service initializes, THE API_Service SHALL default to http://localhost:3001 if no custom URL is configured
2. WHEN a user updates the backend URL in settings, THE System SHALL persist the custom URL in localStorage
3. WHEN the application reloads, THE API_Service SHALL use the persisted custom URL if available
4. THE API_Service SHALL fall back to the default URL if the persisted URL is invalid or empty
