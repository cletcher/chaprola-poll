# Chaprola Poll

A real-time polling application built with [Chaprola](https://chaprola.org) as the backend. Create polls, share links, vote, and watch results update live.

## Live App

**https://chaprola.org/apps/chaprola-poll/poll/**

## Features

- **Create Polls**: Add a title and 2-10 options
- **Share Links**: Get a shareable voting link instantly
- **Vote**: Simple one-click voting with optional team/group tags
- **Live Results**: Auto-refreshing bar charts every 10 seconds
- **Cross-tabulation**: See how votes break down by group
- **Mobile Friendly**: Responsive design works on any device

## Tech Stack

- **Backend**: Chaprola (serverless data platform)
- **Frontend**: Vanilla HTML, CSS, JavaScript (no framework)
- **Hosting**: Chaprola app hosting (`chaprola.org/apps/`)

## Architecture

```
Frontend (static HTML/JS/CSS)
  │
  ├── /report (public, no auth) ──► POLLLIST, POLLDETAIL, RESULTS
  │
  └── /insert_record (via proxy) ──► votes, polls
  │
Chaprola API (api.chaprola.org)
  │
  └── polls.DA, votes.DA, *.PR programs
```

## Chaprola Backend

The backend uses three compiled Chaprola programs:

| Program | Purpose |
|---------|---------|
| POLLLIST.CS | List all open polls |
| POLLDETAIL.CS | Get single poll by ID (parameterized) |
| RESULTS.CS | Get votes with pivot aggregation |

All published with `acl: "public"`.

## Project Structure

```
chaprola-poll/
├── api/
│   └── proxy.js          # Proxy for authenticated write requests
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
├── COOKBOOK.md            # How this was built
├── LESSONS.md            # Documentation feedback
└── README.md             # This file
```

## Deployment

### Deploy Your Own Instance

1. **Register a Chaprola account**:
   ```bash
   curl -X POST https://api.chaprola.org/register \
     -d '{"username":"your-username","passcode":"your-secure-passcode-16chars"}'
   ```

2. **Import the data schema** (creates polls and votes files):
   ```bash
   # Use MCP tools or API to import sample data
   chaprola_import(project="poll", name="polls", data=[...])
   chaprola_import(project="poll", name="votes", data=[...])
   ```

3. **Compile and publish programs**:
   ```bash
   chaprola_compile(project="poll", name="POLLLIST", source="...", primary_format="polls")
   chaprola_publish(project="poll", name="POLLLIST", primary_file="polls", acl="public")
   ```

4. **Update frontend/api/proxy.js** with your API key

5. **Deploy the frontend**:
   ```bash
   cd frontend && tar -czf /tmp/frontend.tar.gz .

   # Get presigned URL
   curl -X POST https://api.chaprola.org/app/deploy \
     -H "Authorization: Bearer $YOUR_API_KEY" \
     -d '{"userid":"your-username","project":"poll"}'

   # Upload tarball
   curl -X PUT "$UPLOAD_URL" --data-binary @/tmp/frontend.tar.gz

   # Process deployment
   curl -X POST https://api.chaprola.org/app/deploy/process \
     -H "Authorization: Bearer $YOUR_API_KEY" \
     -d '{"userid":"your-username","project":"poll","staging_key":"..."}'
   ```

6. **Visit your app** at `https://chaprola.org/apps/your-username/poll/`

### Important: Relative Paths

All internal links must use relative paths (not root-relative) because the app deploys to a subpath:

```html
<!-- Correct -->
<a href="vote.html">Vote</a>
<a href="./">Home</a>

<!-- Wrong - will break! -->
<a href="/vote.html">Vote</a>
<a href="/">Home</a>
```

---

Built with Chaprola MCP by Claude
