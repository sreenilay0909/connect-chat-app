# Design Document

## Overview

This design document outlines the solution for fixing critical bugs and implementing placeholder functionality for non-functional icons in the Connect chat application. The primary focus is on correcting the port mismatch between frontend and backend, and providing appropriate user feedback for features that are not yet fully implemented.

## Architecture

The application follows a client-server architecture:

- **Frontend (React + Vite)**: Runs on port 5173, handles UI and user interactions
- **Backend (Express + MongoDB)**: Runs on port 3001, handles data persistence and API endpoints
- **API Service Layer**: Mediates communication between frontend and backend

The fix involves updating the API service configuration and adding event handlers for non-functional UI elements.

## Components and Interfaces

### 1. API Service (`services/api.ts`)

**Current Issue**: Default BASE_URL is set to `http://localhost:3000` but backend runs on port 3001.

**Solution**: Update the default BASE_URL to `http://localhost:3001`.

```typescript
// Current (incorrect)
let BASE_URL = localStorage.getItem('connect_api_url') || ENV_URL || 'http://localhost:3000';

// Fixed
let BASE_URL = localStorage.getItem('connect_api_url') || ENV_URL || 'http://localhost:3001';
```

### 2. ChatWindow Component (`components/ChatWindow.tsx`)

**Current Issue**: Video, voice call, and microphone icons have no functionality.

**Solution**: Add event handlers that provide user feedback.

**Interface**:
```typescript
interface IconHandlers {
  handleVideoCall: () => void;
  handleVoiceCall: () => void;
  handleVoiceRecord: () => void;
}
```

**Implementation Approach**:
- Add click handlers to video and phone icons
- Add click handler to microphone icon (when input is empty)
- Display toast notifications or alerts indicating feature status
- Use consistent messaging: "This feature is coming soon!"

### 3. Notification System

**Option A**: Use browser's native `alert()` for simplicity
**Option B**: Implement a toast notification component for better UX

**Recommendation**: Start with Option A for quick fix, can be enhanced later with Option B.

## Data Models

No new data models are required. This is purely a bug fix and UI enhancement.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API Service Port Consistency
*For any* application startup, the API service should attempt to connect to port 3001 (matching the backend configuration) unless a custom URL is explicitly configured by the user.

**Validates: Requirements 1.1, 6.1**

### Property 2: Backend Connection Fallback
*For any* failed backend connection attempt, the application should gracefully fall back to localStorage mode and display the "Offline / Local Only" status indicator.

**Validates: Requirements 1.4**

### Property 3: Icon Click Feedback
*For any* non-functional icon click (video, voice, microphone), the system should provide immediate user feedback indicating the feature status.

**Validates: Requirements 2.3, 3.3, 4.7, 5.2**

### Property 4: Microphone Icon Visibility
*For any* chat window state where the input field is empty, the send button should display a microphone icon instead of a send icon.

**Validates: Requirements 4.1**

### Property 5: URL Persistence
*For any* custom backend URL configured by the user, the URL should persist in localStorage and be used on subsequent application loads.

**Validates: Requirements 6.2, 6.3**

## Error Handling

### Connection Errors
- **Scenario**: Backend is not running or unreachable
- **Handling**: API service catches fetch errors, sets `isConnected = false`, returns null to trigger localStorage fallback
- **User Feedback**: Status indicator shows "Offline / Local Only"

### Permission Errors (Future Enhancement)
- **Scenario**: User denies microphone permissions
- **Handling**: Catch permission denial, display error message
- **User Feedback**: Alert or toast notification explaining the issue

### Invalid URL Configuration
- **Scenario**: User enters invalid backend URL in settings
- **Handling**: Validation before saving, fallback to default if invalid
- **User Feedback**: Error message indicating invalid URL format

## Testing Strategy

### Unit Tests
- Test API service initialization with different URL configurations
- Test localStorage persistence and retrieval
- Test fallback behavior when backend is unavailable
- Test icon click handlers trigger appropriate feedback

### Property-Based Tests
- **Property 1**: Generate random application states and verify API service always uses correct port
- **Property 2**: Simulate random connection failures and verify fallback behavior
- **Property 3**: Generate random icon click events and verify feedback is always provided
- **Property 4**: Generate random input field states and verify correct icon display
- **Property 5**: Generate random URL configurations and verify persistence

### Integration Tests
- Test full flow: Frontend → API Service → Backend connection
- Test offline mode: Frontend → API Service (failed) → localStorage
- Test user interactions: Icon clicks → Feedback display

### Manual Testing Checklist
1. Start backend on port 3001
2. Start frontend on port 5173
3. Verify "Cloud Sync Active" indicator appears
4. Stop backend
5. Verify "Offline / Local Only" indicator appears
6. Click video icon → Verify feedback message
7. Click phone icon → Verify feedback message
8. Clear input field and click microphone → Verify feedback message
9. Configure custom backend URL → Verify persistence after reload

## Implementation Notes

### Priority Order
1. **Critical**: Fix port mismatch (blocks all backend functionality)
2. **High**: Add icon click handlers (improves UX, prevents user confusion)
3. **Medium**: Enhance notification system (can use simple alerts initially)

### Backward Compatibility
- Changes are backward compatible
- Existing localStorage data remains valid
- No database schema changes required

### Future Enhancements
- Implement actual video/voice call functionality using WebRTC
- Implement voice message recording using MediaRecorder API
- Add toast notification component for better UX
- Add loading states during connection attempts
