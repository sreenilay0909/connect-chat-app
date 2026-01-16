# Implementation Plan: Bug Fixes and Improvements

## Overview

This implementation plan addresses critical bugs and adds user feedback for non-functional features in the Connect chat application. The tasks are ordered to fix the most critical issue first (port mismatch), followed by UX improvements.

## Tasks

- [x] 1. Fix API Service Port Configuration
  - Update the default BASE_URL in `services/api.ts` from port 3000 to port 3001
  - Verify the change matches the backend configuration in `backend/.env`
  - Test that the connection status indicator updates correctly
  - _Requirements: 1.1, 6.1_

- [ ]* 1.1 Write unit test for API service port configuration
  - Test that default BASE_URL uses port 3001
  - Test that custom URLs override the default
  - Test that localStorage persistence works correctly
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Add Video Call Icon Handler
  - Add click handler to video icon in ChatWindow component
  - Display user feedback message: "Video calls coming soon!"
  - Add appropriate cursor styling for the icon
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Add Voice Call Icon Handler
  - Add click handler to phone icon in ChatWindow component
  - Display user feedback message: "Voice calls coming soon!"
  - Add appropriate cursor styling for the icon
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Add Voice Message Icon Handler
  - Add click handler to microphone icon (when input is empty)
  - Display user feedback message: "Voice messages coming soon!"
  - Ensure handler only triggers when input field is empty
  - _Requirements: 4.1, 4.7_

- [ ]* 4.1 Write unit tests for icon handlers
  - Test video icon click triggers feedback
  - Test voice icon click triggers feedback
  - Test microphone icon click triggers feedback
  - Test microphone icon only appears when input is empty
  - _Requirements: 2.3, 3.3, 4.7, 5.2_

- [x] 5. Checkpoint - Test all fixes
  - Start backend server on port 3001
  - Start frontend server on port 5173
  - Verify "Cloud Sync Active" indicator appears
  - Test all icon click handlers provide feedback
  - Stop backend and verify "Offline / Local Only" indicator
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 6. Write integration tests
  - Test full connection flow: Frontend → Backend
  - Test offline fallback: Frontend → localStorage
  - Test icon interactions in different application states
  - _Requirements: 1.1, 1.4, 5.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Task 1 is critical and should be completed first
- Tasks 2-4 can be completed in parallel
- Each task references specific requirements for traceability
- The checkpoint ensures all fixes work together correctly
