# 💬 DuoBird A Private Chat App for Exactly Two People

> A premium, real-time, dark-themed chat app built for one private conversation between two people.
> No signup, no user list, no group chats. Just the two of you.

**Tech stack:** React 19 • Vite 6 • Tailwind CSS 3 • Firebase (Anonymous Auth + Firestore) • WebRTC

---

## 📑 Table of Contents

1. [Project Idea (Why we built it)](#1-project-idea-why-we-built-it)
2. [Features at a Glance](#2-features-at-a-glance)
3. [Feature Deep Dive (What, How to use, Why, How it's built)](#3-feature-deep-dive)
4. [Tech Stack and Why We Chose It](#4-tech-stack-and-why-we-chose-it)
5. [Folder Structure](#5-folder-structure)
6. [App Flow (Start to Finish)](#6-app-flow-start-to-finish)
7. [Setup Guide (Step by Step)](#7-setup-guide-step-by-step)
8. [Environment Variables](#8-environment-variables)
9. [Firebase Setup](#9-firebase-setup)
10. [Deployment](#10-deployment)
11. [Data Model](#11-data-model)
12. [Security: How Safe Is It?](#12-security-how-safe-is-it)
13. [Mobile Support](#13-mobile-support)
14. [Performance Notes](#14-performance-notes)
15. [Known Limitations](#15-known-limitations)
16. [Troubleshooting](#16-troubleshooting)
17. [Future Ideas](#17-future-ideas)

---

## 1. Project Idea (Why we built it)

- On WhatsApp or Instagram, private conversations get buried under hundreds of chats, groups and notifications.
- The idea was simple: **one small private room where only two people exist.**
- That's why there is **no user search, contact list, group or signup** in this app.
- A single deployment can host **any number of couples or pairs**, each in their own private room, and they can never see each other's messages.
- There is **no custom backend**. Everything runs on Firebase, so **setup and maintenance stay simple.**

---

## 2. Features at a Glance

| # | Feature | Short description |
|---|---------|-------------------|
| 1 | 🔐 Private Room (Name + PIN) | A private thread derived from room name + secret PIN |
| 2 | 🎲 Auto-generate Code | Create a room name and PIN in one click |
| 3 | 👤 Identity Picker | "Who's this?" — pick User 1 or User 2 |
| 4 | ✏️ Rename Yourself | Change your display name; both people see it |
| 5 | ⚡ Real-time Messaging | Messages appear instantly on the other device |
| 6 | ↩️ Reply | Quote a message and reply to it |
| 7 | ✏️ Edit Message | Edit your own text messages |
| 8 | 🗑️ Delete Message | Delete your own messages |
| 9 | 📌 Pin Message | Pin one important message at the top |
| 10 | 🎤 Voice Messages | Record voice notes up to 3 minutes |
| 11 | 📞 Audio Call | Peer-to-peer audio over WebRTC |
| 12 | 📹 Video Call | Peer-to-peer video over WebRTC |
| 13 | 🟢 Online / Offline Status | "Active now" or "Offline" |
| 14 | ⌨️ Typing Indicator | Shows when the other person is typing |
| 15 | ✔✔ Seen Ticks | Shows whether your message was seen |
| 16 | 😀 Emoji Picker | A lightweight 40-emoji popover |
| 17 | 📅 Day Dividers | Today / Yesterday / full date |
| 18 | 🧹 Clear Chat | Permanently delete the whole conversation |
| 19 | 🚪 Switch Identity / Leave Room | Change seat or exit the room |
| 20 | 📱 Mobile-first UI | Notch, safe-area and no-zoom support |
| 21 | 🔄 Smart Auto-scroll | Never yanks you down while reading history |

---

## 3. Feature Deep Dive

> Each feature below has four parts:
> **What it is** • **How to use it** • **Why we built it** • **How it's built (where the code is)**

---

### 3.1 🔐 Private Room (Room Name + PIN)

**What it is:**
When the app opens, it first asks for a **Room Name** and a **4-digit PIN**. Only people who know both land in the same private thread.

**How to use it:**
1. Open the app.
2. Type a room name (for example `our-room`).
3. Type a PIN (for example `4821`).
4. Tap **Continue**.
5. Share the same room name and PIN with your partner. When they enter them, you're both in the same room.

**Why we built it:**
- With only a room *name*, two unrelated couples could pick the same name (like `anshu`) and end up in each other's chat.
- Adding a PIN makes the real room ID depend on **both name and PIN**, so different couples never mix.

**How it's built:**
- `src/utils/room.js` → `slugifyRoomCode()` turns text into a safe format (`"Our Room!!"` becomes `our-room`).
- `buildRoomId(code, pin)` joins them into something like `our-room--4821`. This becomes the Firestore path: `threads/our-room--4821/...`
- `src/components/EntryGate.jsx` → the `RoomStep` component renders this screen.
- `src/context/IdentityContext.jsx` saves the room code and PIN in `localStorage` so you aren't asked again.

---

### 3.2 🎲 Auto-generate Room Code and PIN

**What it is:**
A "Generate" button creates an easy-to-remember code like `willow-482` and a 4-digit PIN.

**How to use it:**
Tap **Generate** on the entry screen, then send the code and PIN to your partner.

**Why we built it:**
People tend to pick weak or identical passwords (`1234`, `love`). Auto-generating gives a random, unique code and saves the effort of thinking one up.

**How it's built:**
`src/utils/room.js`:
- `generateRoomCode()` picks one word from a list of 32 (`amber`, `coral`, `willow`, ...) plus a 3-digit number.
- `generateRoomPin()` returns a random number between 1000 and 9999.

---

### 3.3 🛡️ Optional App-wide Access Code

**What it is:**
If you deploy the app somewhere public, you can add an extra "door": a shared access code on top of the room code.

**How to use it:**
Set `VITE_ACCESS_CODE=something-secret` in `.env`. The entry screen will then ask for this code too. Leave it empty to turn the feature off.

**Why we built it:**
So that if the URL leaks, a random person can't create rooms and burn your Firebase quota.

**How it's built:**
`src/utils/constants.js` → `ACCESS_CODE` is read from the environment. `EntryGate.jsx` checks it through `accessValid`.

> ⚠️ This code ships inside the browser bundle (because of the `VITE_` prefix), so it's only a **light** barrier, not real security. See section 12.

---

### 3.4 👤 Identity Picker ("Who's this?")

**What it is:**
After entering a room, you see two tiles: **User 1** and **User 2**. Pick yours.

**How to use it:**
Tap your tile, then tap **Enter chat**. The device remembers your choice and won't ask again.

**Why we built it:**
There's no login system, so the app needs to know whether this device is "A" or "B" to place messages on the correct side.

**How it's built:**
- `src/utils/constants.js` → `USERS = { A: {...}, B: {...} }` — exactly two hardcoded identities.
- `EntryGate.jsx` → `IdentityStep`.
- `IdentityContext.jsx` stores the choice in `localStorage` (`duo-chat-identity`) and builds the `me` and `them` objects.

---

### 3.5 ✏️ Renaming Yourself

**What it is:**
On the identity screen, each tile has a pencil icon ✏️ that lets you change your name (max 30 characters).

**How to use it:**
Tap the pencil, type a name, press Enter or tap ✓. Both people will see the new name.

**Why we built it:**
"User 1" and "User 2" feel cold. People want their own names or nicknames.

**How it's built:**
- `src/hooks/useProfileNames.js` saves the name in **Firestore** (`threads/{room}/profile/{A|B}`), not just in localStorage.
- Because of that, when you rename yourself, your partner's phone updates in real time (`onSnapshot`).
- `IdentityContext.jsx` → `displayName()` uses the custom name when one exists and falls back to the default.

---

### 3.6 ⚡ Real-time Messaging

**What it is:**
A message you send shows up **instantly** on the other person's device. No refresh needed.

**How to use it:**
Type in the box at the bottom and press **Enter** (or tap send). Use **Shift + Enter** for a new line.

**Why we built it:**
That's the whole point of a chat app. Polling the server repeatedly would be slow and costly, so we used a real-time listener.

**How it's built:**
- `src/hooks/useMessages.js`:
  - A single `onSnapshot` listener updates state the moment a new message arrives.
  - Query: `orderBy("createdAt", "asc")` + `limitToLast(500)`.
  - `send()` calls `addDoc()` with `serverTimestamp()` so time is consistent for everyone, regardless of device clocks.
- Sent messages appear optimistically ("Sending…") and get their time once the server confirms.
- Max length is 4000 characters (enforced in the security rules).

---

### 3.7 ↩️ Reply

**What it is:**
Quote an older message and reply to it, just like WhatsApp.

**How to use it:**
1. Tap any message to open the small action menu.
2. Tap ↩️ **Reply**.
3. A quote appears above the input. Type and send.
4. In the sent message, tap the quote to **smooth-scroll** to the original message, which gets briefly highlighted.

**Why we built it:**
In long chats it's easy to lose track of what a message is answering. Replies keep the context clear.

**How it's built:**
- `useMessages.js` → `buildReplyPreview()` creates a small snapshot of the original (id, sender, type, first 120 characters) and saves it in the new message's `replyTo` field.
- Storing a snapshot means the quote still looks right even if the original is edited or deleted.
- `MessageBubble.jsx` → the `ReplyQuote` component renders the quote.
- `src/utils/scrollToMessage.js` scrolls to the `msg-{id}` element and adds a ring highlight for 1.2 seconds.

---

### 3.8 ✏️ Edit Message

**What it is:**
You can edit a **text** message you sent. It gets a small "edited" label.

**How to use it:**
Tap your message → ✏️ **Edit** → change the text → Enter. Press **Esc** to cancel.

**Why we built it:**
Typo? Deleting and resending feels clumsy.

**How it's built:**
- `useMessages.js` → `editMessage()` only updates `message`, `edited: true` and `editedAt`.
- Only **your own text messages** can be edited (`isMine && type === "text"` check in `MessageBubble.jsx`).
- Firestore rules block changes to `sender`, `createdAt` and `type`, so history can't be tampered with.

---

### 3.9 🗑️ Delete Message

**What it is:**
Delete one of your messages. The chat shows "This message was deleted".

**How to use it:**
Tap your message → 🗑️ **Delete**.

**Why we built it:**
Sent something by mistake? You can take it back.

**How it's built:**
- It's a **soft delete**: the document stays, but `deleted: true`, `message: ""` and `audioUrl: null` are set.
- Why soft? So replies quoting that message don't break (they show "Message deleted").
- Deleting a voice message also removes its audio.

---

### 3.10 📌 Pin Message

**What it is:**
Pin one important message (an address, a time, a plan) in a banner at the top of the chat.

**How to use it:**
Tap a message → 📌 **Pin**. A banner appears at the top. Tap the banner to jump to that message. Tap its ❌ to unpin.

**Why we built it:**
Finding something important in a long chat is hard.

**How it's built:**
- `src/hooks/usePinnedMessage.js` — a room has **only one** pin at a time (`threads/{room}/pinned/current`). Pinning a new message replaces the old one.
- The pin stores a snapshot (preview, sender, type), so the banner renders instantly with no extra lookup and still makes sense if the message is later edited or deleted.
- `src/components/PinnedBanner.jsx` is the banner UI.
- The pinned message itself shows a "📌 Pinned" label.

---

### 3.11 🎤 Voice Messages

**What it is:**
Tap the mic and record a voice note of **up to 3 minutes**.

**How to use it:**
1. Tap the **mic** icon near the input (the browser asks for mic permission — allow it).
2. A timer runs (max 03:00).
3. Tap send to send it, or cancel to discard.
4. The receiver taps ▶️ / ⏸ to play or pause, with a progress display.

**Why we built it:**
Sometimes typing is too much effort, and saying it out loud is easier.

**How it's built:**
- `src/hooks/useVoiceRecorder.js` uses the browser's `MediaRecorder`. It automatically picks a supported format (`webm/opus` → `webm` → `mp4` → `aac`), including for iPhone Safari.
- **Bitrate is only 24 kbps**, which is enough for speech and keeps files tiny.
- The recording is converted to a **base64 data URL** and saved directly on the message document in `audioUrl`. **No separate storage service (Firebase Storage) is needed.**
- The 3-minute cap keeps the document under Firestore's 1 MB limit.
- `src/components/VoiceMessage.jsx` is the player UI (play/pause + duration).

---

### 3.12 📞 Audio Call

**What it is:**
Tap the 📞 icon in the header to call the other person directly.

**How to use it:**
1. Tap the **phone icon** in the header.
2. The other phone shows a full-screen "Incoming audio call".
3. They **Accept** or **Decline**.
4. During the call you get **Mute** and **End** buttons and a running timer.
5. The browser asks for mic permission; you must allow it.

**Why we built it:**
So you can talk inside the same app, without opening another one.

**How it's built:**
- **WebRTC** — audio flows directly between the two devices (peer-to-peer) and never passes through a server.
- **Firestore is used only for the "handshake" (signaling):** SDP offer/answer and ICE candidates. These small messages help the two browsers find each other.
  - `threads/{room}/call/current`
  - `.../callerCandidates/{id}` and `.../calleeCandidates/{id}`
- When the call ends or is declined, that handshake data is **deleted automatically.** No audio is recorded or stored.
- `src/hooks/useCall.js` holds the whole state machine: `idle → outgoing → incoming → active → ended / declined / failed`.
- `src/components/CallOverlay.jsx` is the full-screen call UI.
- `src/utils/webrtc.js` configures Google's **public STUN servers**.

---

### 3.13 📹 Video Call

**What it is:**
Same as audio calling, but with camera.

**How to use it:**
Tap the **video camera icon** in the header. During the call:
- 🎙️ Mute / Unmute
- 📷 Camera on / off (a placeholder shows when off)
- Your small preview and the other person's large video are both shown.

**Why we built it:**
Sometimes you just want to see their face.

**How it's built:**
- It's the same `useCall.js`, started with `startCall("video")`. `getUserMedia` uses video constraints (`facingMode: "user"`, 640px ideal width) for low bandwidth and smooth calls.
- `toggleCamera()` switches the video track on or off without ending the call.
- The call overlay checks `isVideo` to render the video elements.

---

### 3.14 🟢 Online / Offline Status

**What it is:**
A green dot on your partner's avatar in the header, with "Active now" or "Offline".

**How to use it:**
Nothing to do. It works automatically.

**Why we built it:**
So you know whether they're currently around.

**How it's built:**
- `src/hooks/usePresence.js` — every **20 seconds** your `lastSeen` is updated in Firestore (a heartbeat).
- When the tab becomes visible again, a heartbeat is sent right away.
- If your partner's `lastSeen` is older than **30 seconds**, they show as "Offline".
- This is deliberately simple: good enough for two people, not a large-scale presence system.

---

### 3.15 ⌨️ Typing Indicator

**What it is:**
When your partner is typing, three bouncing dots appear in the chat.

**How to use it:**
Automatic.

**Why we built it:**
It makes the chat feel alive and tells you a reply is coming.

**How it's built:**
- `src/hooks/useTyping.js` writes a typing flag to `threads/{room}/typing/{A|B}`.
- **Smart throttling:** it doesn't write on every keystroke, only when typing starts or stops (to save Firestore usage).
- If there are no keystrokes for 2 seconds, "typing" stops.
- If your partner's tab closes suddenly, the indicator **clears itself** after 5 seconds (stale timeout).
- UI: `src/components/TypingIndicator.jsx`.

---

### 3.16 ✔✔ Seen Ticks

**What it is:**
Under your sent messages you see ✔ (sent) and a blue ✔✔ (seen).

**How to use it:**
Automatic.

**Why we built it:**
To know whether your message has been read.

**How it's built:**
- There is no separate "seen" field. `MessageList.jsx` checks: **partner's `lastSeen` time ≥ the message's `createdAt`** → seen.
- That means as soon as your partner is online, every message up to that moment counts as seen. It's simple and needs very few writes.

---

### 3.17 😀 Emoji Picker

**What it is:**
A small popover with 40 popular emojis.

**How to use it:**
Tap the 😀 icon near the input, then tap an emoji to add it to your text.

**Why we built it:**
A heavy emoji library would bloat the app. A small picker is enough and adds **no extra dependency**.

**How it's built:**
`src/components/EmojiPicker.jsx` — emojis live in an array shown in an 8-column grid. Width is `min(18rem, 80vw)` so it never gets clipped on small screens.

---

### 3.18 📅 Day Dividers

**What it is:**
Labels that group the chat by day: **Today**, **Yesterday**, or **Monday, Sep 28**.

**How it's built:**
`src/utils/formatTime.js` → `formatDayLabel()` and `formatTime()` ("9:41 PM"). `MessageList.jsx` inserts a divider before the first message of each new day. UI: `DayDivider.jsx`.

---

### 3.19 🧹 Clear Chat

**What it is:**
Permanently deletes the entire conversation **for both people**.

**How to use it:**
Header ⋮ menu → **Clear chat** → confirm again in the dialog.

**Why we built it:**
Privacy. Sometimes you want a clean slate.

**How it's built:**
- `useMessages.js` → `clearChat()` deletes messages in **batches** (450 per batch, under Firestore's 500 limit) until none remain.
- `ConfirmDialog.jsx` shows the confirmation (red "danger" style).
- Presence, pin and call data are untouched. Other rooms are not affected.

> ⚠️ There is **no undo.**

---

### 3.20 🚪 Switch Identity and Leave Room

**What it is (in the ⋮ menu):**
- **Switch identity** → change your seat (User 1 ↔ User 2). The room stays the same.
- **Leave this room** → remove the room code, PIN and identity from this device and return to the entry screen.

**Why we built it:**
If you picked the wrong seat or you're on a shared device, you need a way out.

**How it's built:**
`IdentityContext.jsx` → `clearIdentity()` and `leaveRoom()` remove the `localStorage` keys.

---

### 3.21 🔄 Smart Auto-scroll

**What it is:**
The chat scrolls to the bottom on new messages, **but only if you were already near the bottom.**

**Why we built it:**
If you're reading older messages and a new one yanks you down, it's very annoying.

**How it's built:**
`src/hooks/useAutoScroll.js` — scrolls smoothly only when you're within **120px** of the bottom.

---

### 3.22 ⏳ Loading, Error and Empty States

- **LoadingState** → "Connecting to Duo…" while connecting to Firebase.
- **ErrorBanner** → a message with a **Retry** button when the connection fails.
- **EmptyState** → a friendly message with your partner's name when the chat is empty.

Files: `LoadingState.jsx`, `ErrorBanner.jsx`, `EmptyState.jsx`.

---

## 4. Tech Stack and Why We Chose It

| Technology | Why we used it |
|-----------|----------------|
| **React 19** | Component-based UI; hooks keep logic separate and easy to follow |
| **Vite 6** | Very fast dev server and builds |
| **Tailwind CSS 3** | Quick, consistent dark-theme styling |
| **Firebase Firestore** | Real-time database with `onSnapshot` built in |
| **Firebase Anonymous Auth** | Gives Firestore an "authenticated" request without any login |
| **WebRTC** | Peer-to-peer audio/video with no server cost |
| **react-icons (Heroicons 2)** | All icons from a single library |
| **ESLint** | Code quality checks |

**Benefits of having no backend:** easy deployment, no server to maintain, and it runs within Firebase's free tier.

---

## 5. Folder Structure

```
chat-app/
├─ src/
│  ├─ components/
│  │  ├─ EntryGate.jsx        # Room + identity screens (login-like, but not a real login)
│  │  ├─ ChatRoom.jsx         # Wires everything together (main screen)
│  │  ├─ ChatHeader.jsx       # Name, online dot, call buttons, ⋮ menu
│  │  ├─ MessageList.jsx      # Message feed + day dividers + seen logic
│  │  ├─ MessageBubble.jsx    # One message + reply/edit/pin/delete menu
│  │  ├─ MessageInput.jsx     # Text box, emoji, mic, reply/edit bar
│  │  ├─ VoiceMessage.jsx     # Voice note player
│  │  ├─ EmojiPicker.jsx      # Emoji popover
│  │  ├─ PinnedBanner.jsx     # Pinned message banner at the top
│  │  ├─ TypingIndicator.jsx  # Typing dots
│  │  ├─ CallOverlay.jsx      # Full-screen audio/video call UI
│  │  ├─ ConfirmDialog.jsx    # "Are you sure?" popup
│  │  ├─ DayDivider.jsx       # Today / Yesterday label
│  │  ├─ EmptyState.jsx       # Empty chat screen
│  │  ├─ LoadingState.jsx     # Connecting screen
│  │  └─ ErrorBanner.jsx      # Error + retry
│  ├─ context/
│  │  └─ IdentityContext.jsx  # Global state: room, PIN, identity, names
│  ├─ firebase/
│  │  └─ config.js            # Firebase init + anonymous sign-in
│  ├─ hooks/
│  │  ├─ useMessages.js       # Messages: send, voice, edit, delete, clear
│  │  ├─ usePresence.js       # Online/offline heartbeat
│  │  ├─ useTyping.js         # Typing indicator
│  │  ├─ useCall.js           # WebRTC call state machine
│  │  ├─ usePinnedMessage.js  # Pin / unpin
│  │  ├─ useProfileNames.js   # Custom names (shared via Firestore)
│  │  ├─ useVoiceRecorder.js  # Mic recording
│  │  └─ useAutoScroll.js     # Smart scrolling
│  ├─ utils/
│  │  ├─ constants.js         # The 2 users, storage keys, access code
│  │  ├─ room.js              # Build room ID + generate code/PIN
│  │  ├─ webrtc.js            # STUN server config
│  │  ├─ formatTime.js        # Time and day labels
│  │  └─ scrollToMessage.js   # Jump to message + highlight
│  ├─ App.jsx                 # Root: auth → entry gate or chat room
│  ├─ main.jsx                # React entry point
│  └─ index.css               # Tailwind + mobile fixes
├─ firestore.rules            # Database security rules
├─ firebase.json              # Firebase hosting + rules config
├─ netlify.toml               # Netlify SPA redirect
├─ vercel.json                # Vercel SPA rewrite
├─ tailwind.config.js         # Theme (colors, animations)
├─ vite.config.js             # Vite config
├─ eslint.config.js           # Lint rules
├─ .env.example               # Environment variable template
└─ package.json
```

**Design rule we followed:** UI (`components/`) and logic (`hooks/`) are kept apart. Every feature has its own hook, so any feature is easy to understand or change.

---

## 6. App Flow (Start to Finish)

```
App opens
   │
   ▼
Firebase anonymous sign-in  ──(fails)──► Error banner + Retry
   │
   ▼
Room + identity saved?
   │                         │
  No                        Yes
   │                         │
   ▼                         ▼
EntryGate                 ChatRoom
  1. Room name + PIN        ├─ Header (status, calls)
  2. "Who's this?"          ├─ Pinned banner
     (+ rename)             ├─ Messages (real-time)
                            ├─ Typing indicator
                            └─ Input (text/emoji/voice)
```

- `App.jsx` completes Firebase auth first, then decides which screen to show.
- `ChatRoom.jsx` connects all the hooks in one place (`useMessages`, `usePresence`, `useTyping`, `useCall`, `usePinnedMessage`).

---

## 7. Setup Guide (Step by Step)

**Requirements:** Node.js 18+ and a Google account (for Firebase).

```bash
# 1. Go to the project folder
cd chat-app

# 2. Install dependencies
npm install

# 3. Create your env file
cp .env.example .env
```

Then open `.env` and fill in your Firebase values (see section 8), and run:

```bash
# 4. Start the dev server
npm run dev
```

Open the link printed in the terminal (usually `http://localhost:5173`).

**How to test with two people:**
- Open one normal browser window and one incognito window, or
- Open the same link on your laptop and your phone.
- Enter the same room name and PIN in both, but pick different identities.
- You can now test messages, voice notes and calls.

**Other commands:**

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build (`dist/` folder) |
| `npm run preview` | Preview the build locally |
| `npm run lint` | Lint the code |

---

## 8. Environment Variables

Copy `.env.example` to `.env` and fill it in:

```env
# Firebase (Console > Project Settings > General > Your apps)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Default names and avatars for the two users (display only, not accounts)
VITE_USER_A_NAME=Aarav
VITE_USER_A_AVATAR=A
VITE_USER_B_NAME=Isha
VITE_USER_B_AVATAR=I

# Optional: extra app-wide access code (empty = off)
VITE_ACCESS_CODE=our-secret-code
```

| Variable | Meaning |
|----------|---------|
| `VITE_FIREBASE_*` | Your Firebase project keys |
| `VITE_USER_A_NAME` / `_B_NAME` | Default names (can be renamed later) |
| `VITE_USER_A_AVATAR` / `_B_AVATAR` | The letter/character shown in the avatar |
| `VITE_ACCESS_CODE` | Optional extra gate |

> 🔒 **Never push `.env` to GitHub or share it inside a zip.** It's already in `.gitignore`, but remove it manually before sharing a zip.
> After changing env variables, restart the dev server.

---

## 9. Firebase Setup

1. [Firebase Console](https://console.firebase.google.com) → **Add project** (Analytics not needed).
2. **Build → Authentication → Get started** → **Enable** the **Anonymous** provider.
3. **Build → Firestore Database → Create database** → **production mode** → pick a region close to you.
4. **Project settings → Your apps → Web (`</>`)** → register the app → copy the `firebaseConfig` values into `.env`.
5. **Deploy the security rules:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore      # pick your existing project, keep firestore.rules
   firebase deploy --only firestore:rules
   ```
   *Or* copy the contents of `firestore.rules` into the Console's **Firestore → Rules** tab and click **Publish**.

> ⚠️ Don't forget to deploy the rules. Otherwise the app won't work, or your data stays unprotected.

---

## 10. Deployment

**Option A — Vercel**
```bash
npm install -g vercel
vercel
# Add the environment variables in the dashboard, then:
vercel --prod
```

**Option B — Netlify**
```bash
npm install -g netlify-cli
netlify deploy --build
# Add the environment variables in Site settings, then:
netlify deploy --build --prod
```

**Option C — Firebase Hosting**
```bash
npm run build
firebase init hosting     # public directory: dist, single-page app: yes
firebase deploy --only hosting
```

The config files for all three (`vercel.json`, `netlify.toml`, `firebase.json`) are already in the project. Each sets up an SPA redirect so refreshing a page doesn't give a 404.

**After deploying:** share the URL and the room name + PIN only with your partner.

> ⚠️ **Calls need HTTPS.** Browsers don't allow mic or camera without it. Vercel, Netlify and Firebase all provide HTTPS, and `localhost` works too.

---

## 11. Data Model

Everything lives under `threads/{roomId}/` (`roomId = roomname--pin`):

```
threads/{roomId}/
 ├─ messages/{messageId}
 │     type        : "text" | "voice"
 │     sender      : "A" | "B"
 │     message     : string            (for text, max 4000 chars)
 │     audioUrl    : base64 data URL   (for voice)
 │     durationSec : number            (for voice)
 │     createdAt   : Timestamp         (serverTimestamp)
 │     replyTo     : { id, sender, type, preview } | null
 │     edited      : boolean, editedAt : Timestamp
 │     deleted     : boolean           (soft delete)
 │
 ├─ presence/{A|B}      →  { lastSeen }
 ├─ typing/{A|B}        →  { isTyping, updatedAt }
 ├─ profile/{A|B}       →  { name, updatedAt }
 ├─ pinned/current      →  { messageId, sender, type, preview, pinnedAt }
 └─ call/current        →  call signaling (offer/answer/status)
      ├─ callerCandidates/{id}
      └─ calleeCandidates/{id}
```

---

## 12. Security: How Safe Is It?

**What protects you:**
- The room ID is **name + PIN**, so nobody can reach a room without knowing both.
- The Firestore rules enforce:
  - Reading and writing require an **authenticated** request (anonymous counts).
  - `sender` can only be `"A"` or `"B"`.
  - A text message can't be empty or longer than 4000 characters.
  - A voice message must include `audioUrl`.
  - When editing, `sender`, `createdAt` and `type` **cannot be changed.**
  - Presence, typing and profile only allow writes to the `A` / `B` slots.
  - **Everything else is denied by default.**
- Call audio/video is **peer-to-peer** and is never stored in Firestore or on a server.

**Honest limitations (please read):**
- There is no real login. Firestore doesn't know whether a browser is "A" or "B". The rules check **shape**, not **who is calling.**
- Anyone who learns the room name + PIN can enter. A PIN is only 4 digits, so also choose a **hard-to-guess room name.**
- `VITE_ACCESS_CODE` is visible in the browser bundle. It's only a light gate.
- Messages are stored as **plain text** in Firestore (not end-to-end encrypted).
- Any authenticated user who knows the room ID can delete data (including via "Clear chat").

**This is fine for casual use between two people who trust each other.** For stronger security:
- Add Firebase **App Check.**
- Add email-link or Google sign-in and allow-list just 2 UIDs in the rules.
- Encrypt messages on the client.

---

## 13. Mobile Support

The app was designed mobile-first, then adapted for desktop. Key fixes:

- **`.app-height` / `.app-min-height`** — `dvh` with a `vh` fallback, so layouts don't break on older Safari, Android WebViews and in-app browsers (Instagram, Facebook).
- **Safe areas** — `env(safe-area-inset-*)` padding on the header, input and call screen for iPhone notches, Dynamic Island and gesture bars.
- **No iOS zoom** — input font is 16px or larger (otherwise Safari zooms in on focus).
- **Overscroll lock** — pull-to-refresh and rubber-banding don't interfere with chat scrolling. The body is fixed and only the message list scrolls.
- **Tap fixes** — `touch-action: manipulation` and a transparent tap highlight (no 300ms delay or gray flash).
- **Emoji picker** — sized to the viewport, so it isn't cut off even on 320px screens.

---

## 14. Performance Notes

- A single `onSnapshot` listener. No polling.
- Query uses `limitToLast(500)`, so the listener stays light even with very long history.
- Typing and presence writes are **throttled** to save Firestore quota.
- Auto-scroll only runs when needed.
- `useMemo` rebuilds message rows only when messages change.
- Everything is function components with small, focused props, so there are few unnecessary re-renders.
- Voice at 24 kbps means small files and fast uploads.

---

## 15. Known Limitations

- **No TURN server.** Only Google's public STUN servers are used. Calls work well on home wifi and mobile data, but may fail on very strict corporate or hotel networks. Fix: Twilio or a self-hosted `coturn`.
- **Only the last 500 messages** are loaded.
- **Voice messages max out at 3 minutes**, because of Firestore's 1 MB document size.
- **Only one pin** at a time.
- **No image or file sharing.**
- **No push notifications.** Calls only ring and messages only appear while the app is open.
- **"Seen"** means "your partner came online", not "they actually scrolled to that message".
- **No emoji reactions** yet.
- Only one call at a time (`call/current`).
- Only 2 users. That's a design choice, not a bug.

---

## 16. Troubleshooting

| Problem | Cause / Fix |
|---------|-------------|
| Stuck on "Connecting to Duo…" | Wrong Firebase values in `.env`, or Anonymous Auth isn't enabled |
| `permission-denied` error | `firestore.rules` not deployed, or outdated |
| `.env` changes have no effect | Stop the dev server and run `npm run dev` again |
| Mic / camera not working | Allow browser permission; the deployed site must be on HTTPS |
| Call won't connect | Strict network (no TURN server); try a different network |
| Voice message won't play | Browser doesn't support the recorded format; update Chrome / Safari |
| 404 on refresh | Check the SPA redirect config (`vercel.json` / `netlify.toml` / `firebase.json`) |
| Partner sees an old name | Check internet on both sides (names sync through Firestore) |
| Picked the wrong identity | ⋮ menu → **Switch identity** |
| Landed in someone else's room | Re-check room name + PIN; use **Leave this room** and enter the right ones |

---

## 17. Future Ideas

- 🖼️ Image / photo sharing
- 🔔 Push notifications (Firebase Cloud Messaging)
- 📡 A TURN server so calls work on every network
- 😍 Message reactions
- 🔒 End-to-end encryption
- 🔍 Chat search
- 🌗 Light / dark theme toggle
- 📌 Multiple pins
- 🗑️ "Delete for me" vs "Delete for everyone"
- 🔐 Real login (email link / Google) for stronger security

---

## 🙌 Final Note

This project was built **with no custom backend**, using only React and Firebase, so it stays simple, cheap, and easy to understand one feature at a time. If something isn't clear, the hooks have comments at the top. Start reading from there.

**Made with ❤️ for two.**
