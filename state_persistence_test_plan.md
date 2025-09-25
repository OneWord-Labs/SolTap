# State Persistence Testing Plan

## Test Environment
- Development Server: http://localhost:3003/
- Browser: Chrome (primary), Safari (secondary)
- Date: 2025-09-24

## Test Scenarios

### 1. Basic Save/Resume Functionality
- [x] Start game in Novice mode
- [ ] Play through multiple levels (at least level 3)
- [ ] Check if auto-save occurs (console logs)
- [ ] Refresh browser tab
- [ ] Verify resume button appears on menu
- [ ] Click resume and verify game continues from saved state

### 2. Different Game Modes
- [ ] Test saving/resuming in Expert mode
- [ ] Test saving/resuming in Practice mode
- [ ] Verify mode-specific data is preserved

### 3. Auto-Save Triggers
- [ ] Test visibility change (switch tabs)
- [ ] Test page refresh (beforeunload)
- [ ] Test closing tab/browser
- [ ] Verify saves occur at 5-second intervals during gameplay

### 4. Error Handling
- [ ] Test storage quota exceeded (fill localStorage)
- [ ] Test corrupted data (manually corrupt localStorage entry)
- [ ] Test version mismatch (manually change version)
- [ ] Test expired saves (manually set old timestamp)
- [ ] Verify user-friendly error messages appear

### 5. Storage Health Warnings
- [ ] Test with localStorage disabled (incognito mode)
- [ ] Test with storage quota issues
- [ ] Verify warning notifications appear on menu

### 6. Cross-Session Persistence
- [ ] Save game in one browser session
- [ ] Close browser completely
- [ ] Reopen browser and navigate to game
- [ ] Verify saved state persists across full browser restart

### 7. Telegram WebApp Integration
- [ ] Test auto-save when Telegram WebApp closes
- [ ] Verify user context is preserved

## Test Results

### Session 1 - Basic Testing
Date: 2025-09-24
Browser: Chrome
