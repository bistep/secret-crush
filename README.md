# Secret Crush — Link-Based Dating & Flirting Chat Website

> **Find a vibe. Start a conversation.**  
> A complete, responsive modern dating & flirting web platform built with a dark romantic aesthetic. Accessible directly via browser URL without any app store downloads.

---

## 🌟 Architecture Highlight: Central Website Owner Inbox

**Secret Crush features a specialized owner-centric real-time communication architecture.** Rather than generic peer-to-peer user chatting, every visitor who clicks a demonstration persona (such as Manuel, Arjun, Meera, Anjali, etc.) has their incoming messages securely delivered to the **Central Website Owner Inbox** in real time:

- When **Visitor A** chats with **Manuel**, the conversation thread appears in your Owner Dashboard labelled `[Manuel]`.
- When **Visitor B** chats with **Meera**, their conversation thread appears separately labelled `[Meera]`.
- When you reply from the Owner Dashboard (`/owner/inbox`), your reply is delivered instantly via WebSockets to that specific visitor's conversation window.
- If you are away or offline, an intelligent **Auto-Reply Concierge Mode** can be enabled to maintain continuous engagement.

---

## 🚀 Key Features

1. **Dark Romantic Aesthetic**
   - Palette of pitch blacks (`#0A0812`), deep violets, rich magenta accents (`#FF2E7E`), and crimson gradients.
   - Glassmorphic navigation, pulsing live presence indicators, smooth card hover dynamics, and celebratory confetti.
   - Mobile-first thumb-friendly layout with a bottom navigation bar on mobile and sleek desktop header.

2. **Welcome Screen & Onboarding**
   - Step 1: Gender identification ("How do you identify?": *Male, Female, Non-binary, Prefer not to say*).
   - Step 2: Preference selection ("Who would you like to chat with?": *Men, Women, Everyone*).
   - Dynamic preference persistence for return sessions.

3. **Mandatory 20+ Age Verification & Terms**
   - Interactive date-of-birth (DOB) calendar input with instant real-time age computation.
   - Strict rejection logic: Access is denied if the user is under 20 years of age.
   - Dual affirmative consent checkboxes for legal age and terms agreement.
   - Clear disclosure explaining how chat data is handled and clarifying persona communication.

4. **18 Distinct Curated Personas**
   - Features 18 distinct profiles across genders (including **Manuel**, **Arjun**, **Adithyan**, **Amal**, **Nikhil**, **Rahul**, **Kevin**, **Vishnu**, **Akhil**, **Rohan**, **Meera**, **Anjali**, **Devika**, **Diya**, **Neha**, **Athira**, **Kiran**, and **Hannah**).
   - High-definition realistic portraits with consistent aspect ratios.
   - Display names, age (20+), location, bio/taglines, and interest chips.
   - "Chat Now" CTA and one-click favorite toggling with celebratory confetti.

5. **Live Presence & Heartbeat System**
   - Real-time online/offline indicators with pulsating green status badges and "Last seen X ago" timestamps.
   - Socket connection tracking across browser sessions.

6. **Dedicated Chat Interface**
   - Persona avatar header, online status, and location.
   - Distinguishable message bubbles (incoming persona/operator messages on left; visitor messages on right).
   - Enter-to-send support, expandable textarea, and quick emoji picker.
   - Quick Flirt Starters ("Hey, how's your evening going? 😊", "You seem really interesting!", etc.).
   - In-chat reporting and blocking modals.

7. **"Chats with Me" Visitor View**
   - Overview of all active conversations initiated by the visitor.
   - Shows persona portraits, last message preview, unread indicators, and live timestamps.

8. **Preferred Age Group Multi-Selector**
   - Selectable age range filters: `20–24`, `25–29`, `30–34`, `35–39`, `40–49`, and `50+`.
   - Multi-selection support with "Apply Filters" button and one-click reset for empty states.

9. **Central Owner Dashboard (`/owner/inbox`)**
   - Protected route requiring operator credentials (`owner` / `secretcrush2026`).
   - Live metrics bar: Active online visitors counter, Total active chats, Unread messages count, and Smart Auto-Reply toggle.
   - Left sidebar with real-time incoming conversations sorted by recency and filtered by Unread or Online.
   - Active conversation pane with persona context, full message history, visitor metadata, quick reply templates, and real-time reply sender.

10. **Safety, Privacy & Moderation**
    - Report Profile modal with categorized reasons.
    - One-click blocking functionality.
    - XSS-safe message rendering.
    - Data privacy controls and local session reset.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express, Socket.IO, dotenv, cors, uuid.
- **Data Layer**: File-persisted relational JSON store (`server/data/db.json`) with zero native build dependencies for 100% reliable local startup on Windows, Mac, and Linux.
- **Production Database**: PostgreSQL / Supabase SQL schema included in `server/schema.sql`.

---

## 💻 Running Locally in VS Code

Follow these straightforward steps to run Secret Crush locally:

### Step 1: Open the Project in VS Code
1. Launch **Visual Studio Code**.
2. Click **File > Open Folder...** and select:
   ```
   C:\Users\nived\.gemini\antigravity\scratch\secret-crush
   ```

### Step 2: Configure Environment Variables
A default `.env` file is already created. You can customize the owner login credentials if desired:
```ini
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
OWNER_USERNAME=owner
OWNER_PASSWORD=secretcrush2026
```

### Step 3: Install Dependencies
Open a terminal in VS Code (`Ctrl + ~` or **Terminal > New Terminal**) and run:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 4: Start the Backend and Frontend
In your terminal, start the backend server:
```bash
cd server
npm start
```
*(The backend starts on `http://localhost:5000`)*

Open a **second terminal tab** and start the Vite development server:
```bash
cd client
npm run dev
```
*(The frontend starts on `http://localhost:5173`)*

---

## 🌐 Opening and Testing the Application

### 1. Visitor Experience
1. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
2. Complete the **Gender & Preference selection** screen.
3. On the **Mandatory 20+ Age Verification** screen, pick a date of birth that makes you 20 years or older (e.g. year 2000), check both confirmation checkboxes, and click **Enter Secret Crush**.
4. Browse the profiles (Manuel, Arjun, Meera, etc.).
5. Click **"Chat with Manuel"** and send a message: *"Hi Manuel, how are you?"*

### 2. Website Owner Experience (Your Dashboard)
1. Open a **second browser tab or Incognito window** and navigate to:
   ```
   http://localhost:5173/owner/inbox
   ```
2. Log in using the default credentials:
   - **Username**: `owner`
   - **Password**: `secretcrush2026`
3. You will immediately see the visitor's conversation with Manuel under incoming chats!
4. Click the conversation thread to see their message, type a reply (e.g. *"Hey! Great to hear from you 😊"*), and press **Send Reply**.
5. Switch back to the visitor's tab: your reply appears instantly in real time!

---

## 🌍 Public Deployment Instructions

To share Secret Crush as a live public link that adults can access from anywhere without installing an app:

### Option A: Render.com / Railway.app (All-in-One Deployment)
1. Push this folder to a GitHub repository.
2. Log into [Render.com](https://render.com) and create a **New Web Service**.
3. Select your repository.
4. Set Build Command:
   ```bash
   npm --prefix server install && npm --prefix client install && npm --prefix client run build
   ```
5. Set Start Command:
   ```bash
   node server/index.js
   ```
6. Add Environment Variables:
   - `PORT`: `5000` (or Render default)
   - `OWNER_USERNAME`: your secret username
   - `OWNER_PASSWORD`: your strong passcode
7. Deploy! Your app will be live at `https://your-app-name.onrender.com`.

### Option B: Supabase / PostgreSQL Integration
To migrate from local JSON to Supabase / PostgreSQL:
1. Open the Supabase SQL Editor.
2. Copy and execute the contents of `server/schema.sql`.
3. Add your Supabase connection string to `DATABASE_URL` in `.env`.

---

## ⚖️ Legal & Community Disclosures
- **Age Requirement**: Strictly 20+ years of age.
- **Demonstration Personas**: All initial profiles and images are virtual demonstration personas. Messages are routed directly to the website operator for romantic conversation and adult entertainment.
- **Privacy**: No personal user contact information is made public.
