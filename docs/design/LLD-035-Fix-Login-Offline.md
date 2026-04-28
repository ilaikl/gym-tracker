# LLD-035: Fix Login When Offline

## 1. Overview
When the user opens the app without an internet connection, the Google Auth sign-in flow fails silently or shows a broken/empty screen. This fix detects the offline state, shows a clear message, and provides a "Continue Offline" path that loads the app from local IndexedDB data.

**Related Requirements:** R49
**Related Plan:** PLAN-035

---

## 2. Architecture Design

### Components Affected
- `AuthService.js` — offline detection, `continueOffline()` method
- `app.js` — login screen render, online/offline event listeners
- `css/style.css` — offline banner styling

### Flow: App Load (Offline)
1. App initialises → `AuthService.init()` is called.
2. Check `navigator.onLine`. If `false`:
   - Show login screen with **offline banner**.
   - Show **"Continue Offline"** button instead of (or below) "Sign in with Google".
   - Disable / grey out the Google sign-in button with a tooltip: "Requires internet connection".
3. User taps **Continue Offline** → `AuthService.continueOffline()` is called.
4. App proceeds to main screen loading data from IndexedDB (same as authenticated flow, but with `uid = null` / local mode).

### Flow: Connectivity Restored
1. App listens to `window.addEventListener('online', ...)`.
2. When back online: show a toast/banner — "Connection restored. Sign in to sync your data." with a **Sign In** button.

### Flow: App Load (Online, Already Signed In)
- No change to existing behaviour.

---

## 3. API Design

### AuthService (new / updated)
```js
/**
 * Returns true if the user is currently authenticated OR in offline mode.
 * Used by app.js to gate the main screen render.
 */
isReady()   // returns boolean

/**
 * Marks the session as "offline mode" — skips Firebase Auth.
 * App proceeds with local-only IndexedDB data.
 */
continueOffline()

/**
 * Check current connectivity.
 */
isOnline()  // returns navigator.onLine
```

### Auth State Logic (updated)
```js
// AuthService.init()
async init() {
  if (!this.isOnline()) {
    // Don't attempt Firebase Auth — show offline UI
    this._offlineMode = true;
    return;
  }
  // existing Firebase onAuthStateChanged logic...
}
```

---

## 4. UI Components

### 4.1 Login Screen — Offline State
```
┌──────────────────────────────────────┐
│           🏋️ GymTracker              │
│                                      │
│  ⚠️  No internet connection          │
│  Sign-in requires connectivity.      │
│                                      │
│  [Sign in with Google] (disabled)    │
│                                      │
│  [Continue Offline]                  │
│  (uses your locally saved data)      │
└──────────────────────────────────────┘
```

### 4.2 Online-Restored Banner (shown inside main app)
```
┌──────────────────────────────────────┐
│ 🌐 Back online — [Sign In & Sync]  ✕ │
└──────────────────────────────────────┘
```

### CSS
```css
.offline-banner {
  background: var(--warning-bg, #fff3cd);
  color: var(--warning-text, #856404);
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.btn-offline {
  width: 100%;
  margin-top: 8px;
  background: var(--secondary-bg);
  border: 1px solid var(--border);
  color: var(--text);
}
```

---

## 5. Implementation Details

### app.js — login screen init
```js
async function initLoginScreen() {
  if (!authService.isOnline()) {
    renderOfflineLoginUI();
    document.getElementById('btn-continue-offline')
      .addEventListener('click', () => {
        authService.continueOffline();
        initMainApp();
      });
  } else {
    renderNormalLoginUI();
  }

  // Watch for connectivity changes
  window.addEventListener('online', () => {
    if (authService.isOfflineMode()) {
      showOnlineRestoredBanner();
    }
  });
}
```

---

## 6. Testing Strategy
- Simulate offline (DevTools → Network → Offline); open app → verify offline banner and "Continue Offline" button appear.
- Tap "Continue Offline" → verify main app loads with local data, no JS errors.
- Re-enable network → verify "Back online" banner appears.
- Sign in normally (online) → verify offline path is not triggered.
