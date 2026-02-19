# Calcetto Teams

A Progressive Web App for generating balanced 5v5 soccer teams with an optimized mobile-first experience.

## Features

- Lightweight vanilla JavaScript implementation with zero framework dependencies
- Mobile-optimized UI with custom design system (no default Bootstrap styling)
- Installable PWA with offline support via Service Worker
- Multi-iteration balancing algorithm (50 attempts) for optimal team distribution
- Real-time balance calculation with visual feedback
- Supabase integration with fallback to mock data for development

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **CSS Framework**: Bootstrap 5 (grid system only)
- **Database**: Supabase (PostgreSQL with REST API)
- **PWA**: Service Worker + Web App Manifest
- **Hosting**: GitHub Pages (static deployment)

## Quick Start

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

### Supabase Configuration (Optional)

The app works out-of-the-box with mock data. To use real data:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the following SQL migration:

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

-- Enable RLS
ALTER TABLE giocatori ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON giocatori
  FOR SELECT USING (true);
```

3. Update `js/supabase.js` with your credentials:

```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Architecture

```
├── index.html              # Main HTML with two screens (selection/result)
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline caching strategy
├── css/
│   └── styles.css         # Custom design system
├── js/
│   ├── app.js             # Main application logic & state management
│   ├── supabase.js        # Database client with mock fallback
│   └── generator.js       # Team balancing algorithm
└── assets/
    └── icon-*.png         # PWA icons
```

## Algorithm

The team generator uses a weighted overall calculation:

```javascript
overall = forma × 0.25 + difesa × 0.20 + passaggi × 0.20 
        + attacco × 0.20 + dribbling × 0.15
```

Teams are balanced through:
1. 50 randomized iterations
2. Greedy assignment (weakest team gets next player)
3. Selection of iteration with highest balance percentage

Balance score: `(min_score / max_score) × 100`

## Deployment

Deployed automatically via GitHub Pages on push to `main`:

```bash
git push origin main
```

Live at: [https://stebarto.github.io/calcetto-teams](https://stebarto.github.io/calcetto-teams)

## PWA Installation

On iOS Safari:
1. Open the app URL
2. Tap Share button
3. Select "Add to Home Screen"

## License

MIT
