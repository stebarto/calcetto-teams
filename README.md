# KickSplit ⚽

A Progressive Web App for generating balanced 5v5 soccer teams with player avatars, post-match voting system, and a retro 90s arcade aesthetic.

## 🎥 Demo Video

[![KickSplit Demo](https://img.youtube.com/vi/RXA1Y0zNhxo/maxresdefault.jpg)](https://www.youtube.com/watch?v=RXA1Y0zNhxo)

**[Watch the full demo on YouTube →](https://www.youtube.com/watch?v=RXA1Y0zNhxo)**

## ✨ Features

- **90s Arcade Style**: Retro soccer game aesthetic inspired by Super Sidekicks 3
- **Player Avatars**: 4 unique avatar styles (barba, biondo, moro, pelato)
- **Smart Team Generation**: Multi-iteration algorithm (100 attempts) for optimal balance
- **Random Regeneration**: Explore different team combinations with one tap
- **Post-Match Voting**: Rate players on fitness (3 levels) and performance (5 stars)
- **Mobile Optimized**: Designed for iPhone with responsive layout
- **PWA Ready**: Installable app with offline support
- **Admin Panel**: Secure player management with Supabase authentication
- **Network-First Caching**: Always get the latest version, cache only for offline

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
- **Styling**: Custom 90s arcade design system + Bootstrap 5
- **Database**: Supabase (PostgreSQL with REST API)
- **Auth**: Supabase Magic Link (email OTP)
- **PWA**: Service Worker (Network-First strategy) + Web App Manifest
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

## 🗄️ Database Schema

### Supabase Configuration

1. Create a project at [supabase.com](https://supabase.com)

2. Run this SQL migration:

```sql
-- Tabella giocatori
CREATE TABLE giocatori (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  forma INT CHECK (forma BETWEEN 1 AND 10),
  difesa INT CHECK (difesa BETWEEN 1 AND 10),
  passaggi INT CHECK (passaggi BETWEEN 1 AND 10),
  attacco INT CHECK (attacco BETWEEN 1 AND 10),
  dribbling INT CHECK (dribbling BETWEEN 1 AND 10),
  ruolo TEXT CHECK (ruolo IN ('DIF', 'CEN', 'ATT', 'JOLLY')),
  avatar TEXT DEFAULT 'moro' CHECK (avatar IN ('barba', 'biondo', 'moro', 'pelato')),
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella partite
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  data_partita TIMESTAMP DEFAULT NOW(),
  team_a_score DECIMAL(3,1) NOT NULL,
  team_b_score DECIMAL(3,1) NOT NULL,
  balance_percentage INT NOT NULL,
  votazione_aperta BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella giocatori per partita
CREATE TABLE match_players (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES giocatori(id) ON DELETE CASCADE,
  team TEXT CHECK (team IN ('A', 'B')),
  player_overall DECIMAL(3,1) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella voti
CREATE TABLE match_votes (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES giocatori(id) ON DELETE CASCADE,
  voto_forma INT CHECK (voto_forma BETWEEN 1 AND 3),
  voto_prestazione INT CHECK (voto_prestazione BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella votanti (per evitare voti multipli)
CREATE TABLE match_voters (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  voter_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, voter_token)
);

-- Enable Row Level Security
ALTER TABLE giocatori ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_voters ENABLE ROW LEVEL SECURITY;

-- Policies per lettura pubblica
CREATE POLICY "Allow public read giocatori" ON giocatori
  FOR SELECT USING (true);

CREATE POLICY "Allow public read matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Allow public read match_players" ON match_players
  FOR SELECT USING (true);

CREATE POLICY "Allow public read match_votes" ON match_votes
  FOR SELECT USING (true);

-- Policies per scrittura autenticata (admin)
CREATE POLICY "Allow authenticated write giocatori" ON giocatori
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write matches" ON matches
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write match_players" ON match_players
  FOR ALL USING (auth.role() = 'authenticated');

-- Policies per votazioni (pubbliche)
CREATE POLICY "Allow public write match_votes" ON match_votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public write match_voters" ON match_voters
  FOR INSERT WITH CHECK (true);

-- Indici per performance
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_votes_match ON match_votes(match_id);
CREATE INDEX idx_match_voters_token ON match_voters(match_id, voter_token);
```

3. Configure Authentication:
   - Go to Authentication → URL Configuration
   - Set **Site URL**: `https://stebarto.github.io/calcetto-teams/`
   - Add to **Redirect URLs**: `https://stebarto.github.io/calcetto-teams/**`

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

### Voting System

After confirming teams, a shareable link is generated for post-match voting:

1. **Fitness Rating** (3 levels):
   - 🥵 In Affanno (struggling)
   - 😐 Neutro (normal)
   - 💪 Super in Forma (excellent)

2. **Performance Rating** (1-5 stars):
   - Rate match performance from 1 to 5 stars

3. **Anonymous Voting**:
   - Each device can vote once per match
   - Token stored in localStorage

## 📂 Project Structure

```
├── index.html              # Main app (selection + results)
├── match.html              # Voting page
├── manifest.json           # PWA configuration
├── service-worker.js       # Network-first caching
├── version.js              # Auto-versioning system
├── css/
│   └── styles.css         # 90s arcade design system
├── js/
│   ├── app.js             # Main logic & state
│   ├── admin.js           # Admin panel & auth
│   ├── generator.js       # Team balancing algorithm
│   ├── match.js           # Voting system
│   └── supabase.js        # Database client
├── assets/
│   ├── favicon_io/        # Favicon files
│   ├── AppImages/         # PWA icons (iOS/Android/Windows)
│   ├── giocatori/         # Player avatars (4 PNG files)
│   └── votazioni/         # Voting icons (3 PNG files)
└── tests/
    ├── test-runner.html   # Test suite runner
    ├── supabase.test.js   # Database tests
    └── generator.test.js  # Algorithm tests
```

## 🎨 Design System

**Color Palette**:
- Grass Green: `#3D7F3F` (background)
- Sky Blue: `#4A90E2` (Team B, buttons)
- Sunny Yellow: `#FFD700` (primary actions)
- Team A Red: `#E53935`
- Bright Green: `#4CAF50` (success)

**Typography**: Arial Black (90s arcade feel)

**Components**:
- Player cards with avatars (48x48px)
- Role badges (Dif, Cen, Att, Jolly)
- Gradient buttons with shadow effects
- White cards on colored backgrounds

## 🔐 Admin Access

1. Click the gear icon in the header
2. Enter authorized email (configured in code)
3. Check email for magic link
4. Manage players:
   - Add/edit/delete players
   - Set player attributes (1-10 scale)
   - Choose avatar style
   - Assign role (DIF/CEN/ATT/JOLLY)

## 🧪 Testing

Run the test suite locally:

```bash
# Open in browser
open tests/test-runner.html
```

Tests include:
- Supabase connection
- Team generation algorithm
- Balance calculation
- Mock data fallback

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
