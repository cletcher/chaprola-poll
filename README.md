# Chaprola Poll

A real-time polling application built with [Chaprola](https://chaprola.org) as the backend. Create polls, share links, vote, and watch results update live.

## Features

- **Create Polls**: Add a title and 2-10 options
- **Share Links**: Get a shareable voting link instantly
- **Vote**: Simple one-click voting with optional team/group tags
- **Live Results**: Auto-refreshing bar charts every 10 seconds
- **Cross-tabulation**: See how votes break down by group
- **Mobile Friendly**: Responsive design works on any device

## Live Demo

**Coming Soon** - Deploy your own instance following the instructions below.

## Screenshots

### Home - Browse Open Polls
```
┌─────────────────────────────────────────────┐
│ ChaprolaPoll          Browse | Create       │
├─────────────────────────────────────────────┤
│                                             │
│  Friday Lunch Order - March 28              │
│  ┌──────┐ Created Mar 25, 2026              │
│  │ open │                                   │
│  └──────┘                                   │
│  [Pizza] [Thai Food] [Mexican] [Sandwiches] │
│                                             │
│  [Vote]  [Results]                          │
│                                             │
└─────────────────────────────────────────────┘
```

### Results - Live Vote Counts
```
┌─────────────────────────────────────────────┐
│  Friday Lunch Order - March 28              │
│  ┌──────┐  47 votes                         │
│  │ open │                                   │
│  └──────┘                                   │
│                                             │
│  Pizza        ████████████████████  14 (30%)│
│  Mexican      ███████████████       12 (26%)│
│  Sandwiches   ████████████          10 (21%)│
│  Thai Food    ██████████            11 (23%)│
│                                             │
│              Auto-refreshing every 10s      │
└─────────────────────────────────────────────┘
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ index   │ │  vote   │ │ results │ │ create  │            │
│  │  .html  │ │  .html  │ │  .html  │ │  .html  │            │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘            │
│       │           │           │           │                  │
└───────┼───────────┼───────────┼───────────┼──────────────────┘
        │           │           │           │
        ▼           ▼           ▼           ▼
┌───────────────────────────────────────────────────┐
│                  Chaprola API                      │
│  ┌────────────────────┐  ┌─────────────────────┐  │
│  │ /report (public)   │  │ /insert_record      │  │
│  │ - POLLLIST         │  │ (via Vercel proxy)  │  │
│  │ - POLLDETAIL       │  │                     │  │
│  │ - RESULTS          │  │                     │  │
│  └────────────────────┘  └─────────────────────┘  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │              Chaprola Storage                │  │
│  │  polls.DA  │  votes.DA  │  *.PR programs    │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

## Tech Stack

- **Backend**: Chaprola (serverless data platform)
- **Frontend**: Vanilla HTML, CSS, JavaScript (no framework)
- **Proxy**: Vercel Serverless Functions (Node.js)
- **Hosting**: Vercel

## Local Development

### Prerequisites

- Node.js 18+
- Vercel CLI (`npm i -g vercel`)
- A Chaprola account and API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chaprola-poll.git
   cd chaprola-poll
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your CHAPROLA_API_KEY
   ```

3. **Run locally**
   ```bash
   vercel dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Chaprola Backend Setup

If you're setting up your own Chaprola backend:

1. **Register an account** using the MCP server or API
2. **Import seed data** - see `chaprola/setup.sh` for the data structure
3. **Compile programs** - `POLLLIST.CS`, `POLLDETAIL.CS`, `RESULTS.CS`
4. **Publish reports** with `acl: "public"`
5. **Update the frontend** with your userid

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variable: `CHAPROLA_API_KEY`

3. **Deploy**
   - Vercel will automatically deploy on push

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CHAPROLA_API_KEY` | Your Chaprola API key (starts with `chp_`) |

## Project Structure

```
chaprola-poll/
├── api/
│   └── proxy.js          # Serverless function for authenticated requests
├── frontend/
│   ├── index.html        # Home page - list polls
│   ├── vote.html         # Voting page
│   ├── results.html      # Results page with live updates
│   ├── create.html       # Create new poll
│   ├── styles.css        # All styles
│   └── app.js            # Shared utilities
├── chaprola/
│   ├── POLLLIST.CS       # List open polls
│   ├── POLLDETAIL.CS     # Get single poll
│   ├── RESULTS.CS        # Get votes for a poll
│   └── setup.sh          # Backend setup documentation
├── vercel.json           # Vercel configuration
├── COOKBOOK.md           # How this was built
├── LESSONS.md            # Documentation feedback
└── README.md             # This file
```

## API Endpoints

### Public Reports (no auth required)

| Endpoint | Description |
|----------|-------------|
| `/report?...&name=POLLLIST` | List all open polls |
| `/report?...&name=POLLDETAIL&poll_id=X` | Get poll details |
| `/report?...&name=RESULTS&poll_id=X` | Get votes for poll |

### Proxy Endpoints (authenticated via proxy)

| Action | Description |
|--------|-------------|
| `POST /api/proxy` `{action: "vote", ...}` | Cast a vote |
| `POST /api/proxy` `{action: "create_poll", ...}` | Create new poll |

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Chaprola](https://chaprola.org) - a unique serverless data platform
- Hosted on [Vercel](https://vercel.com)
- Inspired by simple tools like Strawpoll and Doodle

---

Built with Chaprola MCP by Claude
