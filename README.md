# Duo — a chat app for exactly two people

A premium, real-time, dark-themed chat application built for one private
conversation between two predefined people. No signup, no user list, no
group chats — just the two of you.

Built with **React 19 + Vite + Tailwind CSS**, backed entirely by
**Firebase Authentication (anonymous) + Firestore**. No custom backend.

---

## 1. Project structure

```
chat-app/
├─ src/
│  ├─ components/        # All UI components
│  │  ├─ EntryGate.jsx       # "Who's this?" identity picker (not a real login)
│  │  ├─ ChatRoom.jsx        # Composes header + list + input
│  │  ├─ ChatHeader.jsx      # Top nav: avatar, name, online dot
│  │  ├─ MessageList.jsx     # Scrollable message feed + day dividers
│  │  ├─ MessageBubble.jsx   # Single message bubble
│  │  ├─ MessageInput.jsx    # Bottom composer
│  │  ├─ EmojiPicker.jsx     # Lightweight emoji popover
│  │  ├─ DayDivider.jsx      # "Today" / "Yesterday" separators
│  │  ├─ EmptyState.jsx      # Shown when there are 0 messages
│  │  ├─ LoadingState.jsx    # Connecting screen
│  │  └─ ErrorBanner.jsx     # Connection error UI
│  ├─ context/
│  │  └─ IdentityContext.jsx # Remembers which of the 2 users this device is
│  ├─ firebase/
│  │  └─ config.js           # Firebase init + anonymous sign-in
│  ├─ hooks/
│  │  ├─ useMessages.js      # Real-time Firestore subscription + send()
│  │  ├─ usePresence.js      # Simple online/offline heartbeat
│  │  └─ useAutoScroll.js    # Scroll-to-bottom behavior
│  ├─ utils/
│  │  ├─ constants.js        # The 2 users, thread id, access code
│  │  └─ formatTime.js       # Timestamp + day-label formatting
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ firestore.rules       # Security rules (only these 2 identities can write)
├─ firebase.json         # Optional Firebase Hosting config
├─ netlify.toml          # Netlify SPA redirect config
├─ vercel.json           # Vercel SPA rewrite config
├─ .env.example
└─ package.json
```

---

## 2. How the "two users only" model works

There is no username/password system. Instead:

1. `src/utils/constants.js` hardcodes exactly two identities, **User A**
   and **User B** (display name + avatar letter, configurable via `.env`).
2. On first visit, `EntryGate.jsx` asks "who's this?" and the person taps
   their name, optionally behind a shared **access code** you set once and
   tell only the other person.
3. That choice is saved to `localStorage` on that device, so it's never
   asked again on that phone/laptop.
4. Firestore itself doesn't know or care about identity beyond requiring
   *some* authenticated request — every visitor is silently signed in
   anonymously (`ensureSignedIn()`), and `firestore.rules` only allows
   writes where `sender` is `"A"` or `"B"`.

This keeps things simple and backend-free while still stopping a random
visitor with the URL from posting into your conversation (they'd need the
access code).

> **Note on security:** Firestore rules here check *shape*, not *who the
> person actually is* (there's no real auth binding a browser to "A" vs
> "B" — that would require a real login system). For two people who trust
> each other with a shared link + access code, this is an appropriate
> level of protection. If you need stronger guarantees, add Firebase App
> Check and/or a real per-person auth provider (email link, Google
> sign-in) mapped to two allow-listed UIDs in the rules.

---

## 3. Firebase setup

1. Go to the [Firebase Console](https://console.firebase.google.com) →
   **Add project** (Google Analytics optional, not needed here).
2. Inside the project: **Build → Authentication → Get started** → enable
   the **Anonymous** sign-in provider.
3. **Build → Firestore Database → Create database** → start in
   **production mode** → pick a region close to you both.
4. Go to **Project settings → General → Your apps → Add app → Web (</>)**,
   register a nickname (e.g. "duo-chat-web"), and copy the `firebaseConfig`
   values shown.
5. Deploy the included security rules:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # choose your existing project, keep firestore.rules
   firebase deploy --only firestore:rules
   ```
   (Or paste the contents of `firestore.rules` directly into the Firestore
   **Rules** tab in the console and click **Publish**.)

---

## 4. Local installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
```

Open `.env` and fill in:

```env
VITE_FIREBASE_API_KEY=your-value
VITE_FIREBASE_AUTH_DOMAIN=your-value
VITE_FIREBASE_PROJECT_ID=your-value
VITE_FIREBASE_STORAGE_BUCKET=your-value
VITE_FIREBASE_MESSAGING_SENDER_ID=your-value
VITE_FIREBASE_APP_ID=your-value

VITE_USER_A_NAME=YourName
VITE_USER_A_AVATAR=Y
VITE_USER_B_NAME=TheirName
VITE_USER_B_AVATAR=T

VITE_ACCESS_CODE=pick-something-only-you-two-know
```

```bash
# 3. Run the dev server
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`) — open it in
two different browser profiles / devices to simulate both people and watch
messages sync instantly.

---

## 5. Deployment

### Option A — Vercel
```bash
npm install -g vercel
vercel
```
When prompted, add the same environment variables from `.env` in the
Vercel dashboard (**Project → Settings → Environment Variables**), then
redeploy: `vercel --prod`.

### Option B — Netlify
```bash
npm install -g netlify-cli
netlify deploy --build
```
Add the environment variables in **Site settings → Environment variables**,
then run `netlify deploy --build --prod`.

### Option C — Firebase Hosting
```bash
npm run build
firebase init hosting   # public directory: dist, single-page app: yes
firebase deploy --only hosting
```

After deploying, share the URL and the access code with the other person
only. Each of you opens it once, picks your name, and you're both in the
same real-time conversation from then on.

---

## 6. Data model

Every message is a document in:
```
threads/duo-thread/messages/{messageId}
```
with fields:
```ts
{
  sender: "A" | "B",
  message: string,
  createdAt: Timestamp   // set via serverTimestamp()
}
```

Presence heartbeats live separately in:
```
threads/duo-thread/presence/{A|B}  → { lastSeen: Timestamp }
```

Audio-call signaling lives in a single document plus two small
subcollections (see section 8 below):
```
threads/duo-thread/call/current
threads/duo-thread/call/current/callerCandidates/{id}
threads/duo-thread/call/current/calleeCandidates/{id}
```

---

## 7. Audio calling

Tap the phone icon in the header to call the other person. This uses
**WebRTC** for the actual audio (peer-to-peer, doesn't touch Firestore)
and Firestore purely as the **signaling channel** — the small handshake
messages (SDP offer/answer + ICE candidates) needed for the two browsers
to find each other.

- No new dependencies and no custom backend — it reuses the same
  Firebase project as the chat.
- Only connection-setup metadata is stored in Firestore, and it's
  deleted again automatically once the call ends or is declined. No
  audio is ever recorded or stored.
- Uses public Google STUN servers only (see `src/utils/webrtc.js`) — no
  TURN/relay server. This works on the large majority of home wifi and
  mobile networks. If a call fails to connect from behind a very strict
  corporate/hotel network, that's the reason; a TURN server (e.g. via
  Twilio or a self-hosted `coturn`) would fix it but is out of scope for
  a simple two-person app.
- The browser will ask for microphone permission the first time either
  of you starts or accepts a call — you'll need to allow it.
- `src/hooks/useCall.js` holds the whole state machine (calling,
  ringing, active, hang up, decline, mute) and `CallOverlay.jsx` is the
  full-screen call UI.

---

## 8. Clear chat

The **⋮ menu → Clear chat** option in the header permanently deletes
every message in the shared thread for both people. It asks for
confirmation first (there's no undo — this is a real, permanent delete,
not an archive). It doesn't touch presence data or affect an in-progress
call. See `clearChat()` in `src/hooks/useMessages.js`.

---

## 9. Mobile and cross-browser support

The whole UI was already mobile-first, but a few device-specific quirks
are handled explicitly:

- **Full-height screens** use a `.app-height` / `.app-min-height` utility
  (in `index.css`) instead of relying only on the `dvh` unit — some
  older Safari, older Android WebViews, and in-app browsers (Instagram,
  Facebook) don't support `dvh` and would otherwise collapse the layout.
- **Notch and home-indicator safe areas** (iPhones with a notch/Dynamic
  Island, and gesture-nav Android phones) are respected via
  `env(safe-area-inset-*)` padding on the header, the message composer,
  and the full-screen call overlay.
- **No accidental zoom on iOS** — the message input is at least 16px,
  since Safari on iPhone auto-zooms the page when you focus a smaller
  input.
- **No rubber-band/pull-to-refresh interference** while scrolling
  through messages (`overscroll-behavior`).
- Fast tap response and no gray tap-flash on mobile Chrome/Safari
  (`touch-action: manipulation`, transparent tap highlight).
- The emoji picker sizes itself to the viewport so it can't get clipped
  off the edge of narrow phones (~320px wide).

---

## 10. Notes on performance

- Messages render via a single `onSnapshot` listener — no polling.
- `useAutoScroll` only force-scrolls when the reader was already near the
  bottom, so scrolling up through history is never interrupted.
- Firestore query is capped with `limitToLast(500)` to keep the listener
  and re-renders bounded on very long histories.
- All components are function components with narrow, focused props —
  no prop-drilling beyond two levels, no unnecessary context re-renders.
