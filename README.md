# KickSplit ⚽

A Progressive Web App for generating balanced 5v5 soccer teams with a retro 90s arcade aesthetic and mobile-first design.

## ✨ Features

- **90s Arcade Style**: Retro soccer game aesthetic inspired by Super Sidekicks
- **Smart Team Generation**: Multi-iteration algorithm (100 attempts) for optimal balance
- **Random Regeneration**: Explore different team combinations with one tap
- **Mobile Optimized**: Designed for iPhone 15 with screenshot-ready layout
- **PWA Ready**: Installable app with offline support
- **Admin Panel**: Secure player management with Supabase authentication
- **Zero Dependencies**: Vanilla JavaScript with Bootstrap grid only

## 🎮 Live Demo

**[Play Now →](https://stebarto.github.io/calcetto-teams/)**

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/stebarto/calcetto-teams.git
cd calcetto-teams

# Serve with any static server
python -m http.server 8000
# or
npx serve
```

Visit `http://localhost:8000`

## 🏗️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Custom 90s arcade design system + Bootstrap 5 grid
- **Database**: Supabase (PostgreSQL with REST API)
- **Auth**: Supabase Magic Link (email OTP)
- **PWA**: Service Worker + Web App Manifest
- **Hosting**: GitHub Pages

## 📱 PWA Installation

### iOS (Safari)
1. Open https://stebarto.github.io/calcetto-teams/
2. Tap the Share button
3. Select "Add to Home Screen"

### Android (Chrome)
1. Open the app URL
2. Tap the menu (⋮)
3. Select "Install app" or "Add to Home Screen"

## 🗄️ Database Setup

### Supabase Configuration

1. Create a project at [supabase.com](https://supabase.com)

2. Run this SQL migration:

```sql
CREATE TABLE giocatori (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  forma INT CHECK (forma BETWEEN 1 AND 10),
  difesa INT CHECK (difesa BETWEEN 1 AND 10),
  passaggi INT CHECK (passaggi BETWEEN 1 AND 10),
  attacco INT CHECK (attacco BETWEEN 1 AND 10),
  dribbling INT CHECK (dribbling BETWEEN 1 AND 10),
  ruolo TEXT CHECK (ruolo IN ('DIF', 'CEN', 'ATT', 'JOLLY')),
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE giocatori ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON giocatori
  FOR SELECT USING (true);

-- Allow authenticated write access
CREATE POLICY "Allow authenticated write" ON giocatori
  FOR ALL USING (auth.role() = 'authenticated');
```

3. Configure Authentication:
   - Go to Authentication → URL Configuration
   - Set **Site URL**: `https://stebarto.github.io/calcetto-teams/`
   - Add to **Redirect URLs**: `https://stebarto.github.io/calcetto-teams/`

4. Update `js/supabase.js`:

```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## 🎯 How It Works

### Team Generation Algorithm

**Initial Generation** (Best Balance):
1. Run 100 randomized iterations
2. Each iteration: shuffle → sort by overall → greedy assignment
3. Select the most balanced result

**Regeneration** (Exploration):
1. Shuffle all 10 players randomly
2. Split: first 5 → Team A, last 5 → Team B
3. Calculate balance percentage

### Overall Calculation

```javascript
overall = forma × 0.25 + difesa × 0.20 + passaggi × 0.20 
        + attacco × 0.20 + dribbling × 0.15
```

### Balance Score

```javascript
balance = (min_team_score / max_team_score) × 100
```

- **90-100%**: Excellent (green)
- **80-89%**: Good (yellow)
- **<80%**: Poor (red)

## 📂 Project Structure

```
├── index.html              # Main app with 4 screens
├── manifest.json           # PWA configuration
├── service-worker.js       # Offline caching
├── css/
│   └── styles.css         # 90s arcade design system
├── js/
│   ├── app.js             # Main logic & state
│   ├── admin.js           # Admin panel & auth
│   ├── generator.js       # Team balancing algorithm
│   └── supabase.js        # Database client
└── assets/
    ├── favicon_io/        # Favicon files
    └── AppImages/         # PWA icons (iOS/Android/Windows)
```

## 🎨 Design System

**Color Palette**:
- Grass Green: `#3D7F3F`
- Sky Blue: `#4A90E2`
- Sunny Yellow: `#FFD700`
- Team A Red: `#E53935`
- Team B Orange: `#FF8C00`

**Typography**: Arial Black (90s arcade feel)

## 🔐 Admin Access

1. Click the gear icon in the header
2. Enter authorized email
3. Check email for magic link
4. Manage players (add/edit/delete)

## 🚢 Deployment

Automatic deployment via GitHub Pages:

```bash
git push origin main
```

The app is automatically built and deployed to:
**https://stebarto.github.io/calcetto-teams/**

## 📝 License

MIT

---

Made with ⚽ by [stebarto](https://github.com/stebarto)
