# Heiyu Quiz

Real-time, mobile-first multiplayer quiz. Create a room, share a link/code, and play from any device.

- **Live:** https://www.heiyuquiz.com  
- **Preview:** https://heiyuquiz-client.vercel.app

---

## Table of Contents
- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Getting Started (Local Dev)](#getting-started-local-dev)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Quality & Accessibility](#quality--accessibility)
- [Monetization](#monetization)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- Host creates a **room**; players join via **link or code** (no login).
- **Realtime** answer flow and scoreboard.
- **Host controls:** start round, reveal answers, next/prev.
- **Question sources:**
  - `random` — default fallback (always available)
  - `ai` — pluggable provider (coming soon)
  - `pack` — curated sets (optional)
- **Mobile-first UI**, designed for quick, casual play.
- **AdSense-ready** layout (disabled in dev).

---

## Demo
- **Live game:** https://www.heiyuquiz.com  
- **Staging/preview:** https://heiyuquiz-client.vercel.app

> Best experienced with 2+ devices: one host screen + player phones.

---

## Tech Stack
- **Frontend:** HTML, CSS, Vanilla JS (ES modules)
- **Hosting:** GitHub Pages / Vercel (static)
- **Build/Tooling:** lightweight, no framework
- **AI (planned):** provider-agnostic adapter for question generation

---

## How It Works
1. **Create Room:** Host generates a room and shares the join link/code.
2. **Join & Ready Up:** Players enter nicknames; lobby shows connected players.
3. **Play Rounds:** Host starts the round; players answer in real time.
4. **Reveal & Score:** Host reveals the correct answer; scoreboard updates.
5. **Next / Previous:** Host can navigate between questions and rounds.

Question sources are **pluggable**. Today `random` is the default; the `ai` source is wired behind a simple interface so it can be toggled on once credentials and provider are configured.

---

## Getting Started (Local Dev)

```bash
# 1) Clone
git clone https://github.com/IrishDec/heiyuquiz-client.git
cd heiyuquiz-client

# 2) Install a tiny static server for local testing (one option)
#    If you already use something like `serve` or `http-server`, use that.
npm i -g serve

# 3) Run locally
serve .

# 4) Open
# http://localhost:3000 (or the port shown in your terminal)
No build step required. It’s a purely static client.

Environment Variables
None required for the random question source.

When enabling ai questions, provide the relevant provider key (e.g., via a local .env and injected at deploy time), and enable the ai source in the configuration module. Do not commit secrets.

Project Structure
arduino
Copy code
heiyuquiz-client/
├─ index.html         # entry
├─ style.css          # global styles
├─ app.js             # core app & state
├─ consent.js         # consent/ads related helpers
├─ assets/            # icons, images, manifest
└─ README.md
Available Scripts
No framework-specific scripts. Use any static server for local testing, e.g.:

bash
Copy code
npx serve .
# or
npx http-server .
Deployment options:

GitHub Pages: push to main → served via Pages.

Vercel: “Import Project” → deploy previews on PRs.

Quality & Accessibility
Performance: lean, no runtime framework.

Accessibility: semantic HTML where possible; large tap targets for mobile.

Responsive: mobile-first layout; scales up cleanly for tablets/desktops.

Monetization
AdSense: placements are prepared but disabled in development.

Follow provider guidelines and avoid intrusive formats that harm UX.

Roadmap
 Ship AI question provider adapter + toggle in UI

 Curated question packs with categories/difficulty

 Session persistence & sharing improvements

 Enhanced moderation and room controls

 Lightweight analytics (privacy-first)

Contributing
Issues and PRs are welcome. Please:

Keep PRs small and focused.

Describe UX impact and test steps.

Avoid adding heavy dependencies.

License
MIT — see LICENSE.

sql
Copy code

# Step 2 — Commit
```bash
git add README.md
git commit -m "docs: professional README with features, setup, and roadmap"
git push origin maining. 
