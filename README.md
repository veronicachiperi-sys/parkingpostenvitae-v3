# POST Parking Tracker

Pool-based parking spot management for the POST property. Spots are not tied to units — they're assigned on request based on availability.

> "Parking spots are limited and subject to availability."

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/veronicachiperi-sys/parkingenvitaepost.git
cd parkingenvitaepost

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app opens at **http://localhost:3000**

### Deploy (optional)

```bash
npm run build
```

This creates a `dist/` folder you can deploy to Netlify, Vercel, or any static host.

## How It Works

| Action | Steps |
|--------|-------|
| **Assign a spot** | Check dashboard for availability → tap **Assign** → fill in guest/unit/vehicle/dates → **Save** |
| **Release a spot** | Find the occupied spot → tap **Release** → spot returns to the pool |
| **No spots left** | Dashboard shows 0 available → inform guest parking is unavailable, direct to street parking |
| **Reserve ahead** | Assign a spot with status set to **Reserved** for upcoming guests |

## File Structure

```
src/
├── main.jsx           # Entry point
├── index.css          # Global styles & CSS variables
├── data.js            # Spot defaults, zones, status config
├── useLocalStorage.js # Persistent storage hook
├── App.jsx            # Main app shell
├── App.module.css     # App layout styles
├── SpotCard.jsx       # Individual spot card
├── SpotCard.module.css
├── AssignModal.jsx    # Assign/edit modal form
└── AssignModal.module.css
```

## Notes

- Data persists in the browser's localStorage — each computer keeps its own data
- For shared team access, consider deploying and adding a backend database later
- Adjust spot count and zones in `src/data.js` as new spots become available from PM
