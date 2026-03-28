# Chaprola Poll

A simple, fast poll/survey application built with [Chaprola](https://chaprola.org) as the backend.

## Features

- Create polls with multiple options
- Vote on open polls
- View live results with auto-refresh
- Cross-tabulation by voter group/team
- Mobile-friendly design
- No database setup required

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Static HTML/   │────▶│  Cloudflare      │────▶│   Chaprola API  │
│  CSS/JS         │     │  Worker (proxy)  │     │   (backend)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                               │
         │ Public reads (/report)                        │
         └───────────────────────────────────────────────┘
```

- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework)
- **Backend:** Chaprola serverless API
- **Proxy:** Cloudflare Worker or Vercel function (for authenticated writes)

## Quick Start

### 1. Clone and Deploy Frontend

```bash
git clone https://github.com/yourusername/chaprola-poll.git
cd chaprola-poll

# Deploy to Vercel
vercel

# Or deploy to Cloudflare Pages
# (drag frontend/ folder to dashboard)
```

### 2. Deploy Proxy

**Option A: Vercel** (included in main deploy)
```bash
# Set environment variable in Vercel dashboard
CHAPROLA_API_KEY=chp_your_api_key_here
```

**Option B: Cloudflare Worker**
```bash
cd worker
npm install -g wrangler
wrangler login
wrangler secret put CHAPROLA_API_KEY  # Enter your key when prompted
wrangler deploy
```

### 3. Update Proxy URL

Edit `frontend/app.js` and update `PROXY_URL` to point to your deployed proxy:
```javascript
const PROXY_URL = 'https://your-worker.workers.dev';
// or for Vercel: '/api/proxy'
```

## Local Development

```bash
# Serve frontend locally
cd frontend
python -m http.server 8000
# Visit http://localhost:8000

# For full functionality, you'll need to deploy the proxy
# or run a local proxy that adds the API key
```

## Chaprola Setup

The backend uses these Chaprola resources:

| Resource | Description |
|----------|-------------|
| `polls` | Poll records (id, title, options, status) |
| `votes` | Vote records (poll_id, option, voter_tag) |
| `POLLLIST.PR` | Published program to list open polls |
| `POLLDETAIL.PR` | Published program to get poll details |
| `RESULTS.PR` | Published program to get vote results |

### Creating Your Own Backend

1. Register at Chaprola:
```bash
curl -X POST https://api.chaprola.org/register \
  -H "Content-Type: application/json" \
  -d '{"username": "your-app", "passcode": "your-secure-passcode"}'
```

2. Import the data schema (see `COOKBOOK.md` for details)

3. Compile and publish the programs (source in `chaprola/` directory)

## Project Structure

```
chaprola-poll/
├── frontend/
│   ├── index.html      # Home page - list of polls
│   ├── vote.html       # Vote on a poll
│   ├── results.html    # View results
│   ├── create.html     # Create a new poll
│   ├── styles.css      # Custom CSS
│   └── app.js          # JavaScript functions
├── api/
│   └── proxy.js        # Vercel serverless function
├── worker/
│   ├── worker.js       # Cloudflare Worker
│   └── wrangler.toml   # Worker configuration
├── vercel.json         # Vercel deployment config
├── COOKBOOK.md         # Detailed build narrative
├── LESSONS.md          # Documentation feedback
└── README.md           # This file
```

## API Endpoints

The app uses these Chaprola report endpoints (public, no auth required):

| Endpoint | Parameters | Returns |
|----------|------------|---------|
| `/report?name=POLLLIST` | none | Pipe-delimited list of open polls |
| `/report?name=POLLDETAIL` | `poll_id` | Poll title, options, status |
| `/report?name=RESULTS` | `poll_id` | Individual votes with voter tags |

Base URL: `https://api.chaprola.org/report?userid=chaprola-poll&project=poll`

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CHAPROLA_API_KEY` | API key for authenticated operations |
| `CHAPROLA_USERNAME` | Username (default: chaprola-poll) |

### Frontend Configuration

Edit `frontend/app.js`:
```javascript
const USERID = 'your-chaprola-username';
const PROJECT = 'poll';
const PROXY_URL = 'https://your-proxy-url';
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT

## Acknowledgments

- Built on [Chaprola](https://chaprola.org) - serverless data processing
- CSS inspired by modern design systems
- No frameworks were harmed in the making of this app
