#!/bin/bash
# Chaprola Poll Setup Script
# This script recreates the Chaprola backend data and programs

# Note: This script documents the MCP tool calls made to set up the backend.
# It cannot be run directly - use the MCP server tools instead.

echo "Chaprola Poll Backend Setup"
echo "=========================="
echo ""
echo "This script documents the setup steps. Use MCP tools to execute."
echo ""

# 1. Import polls data
cat << 'EOF'
# Import polls with chaprola_import:
{
  "project": "poll",
  "name": "polls",
  "data": [
    {
      "poll_id": "LUNCH2026A",
      "title": "Friday Lunch Order - March 28",
      "options": "Pizza|Thai Food|Mexican|Sandwiches",
      "created_by": "sarah@company.com",
      "created_at": "2026-03-25T10:00:00Z",
      "status": "open"
    },
    {
      "poll_id": "RETRO2026Q1",
      "title": "Q1 Retro: What Should We Improve?",
      "options": "Code Reviews|Documentation|Testing|Communication|Deployment Process",
      "created_by": "mike.chen@company.com",
      "created_at": "2026-03-20T14:30:00Z",
      "status": "open"
    },
    {
      "poll_id": "FEAT2026APR",
      "title": "Product Roadmap: April Feature Priority",
      "options": "Dark Mode|Mobile App|API Integrations|Performance Improvements|User Dashboard",
      "created_by": "product@company.com",
      "created_at": "2026-03-22T09:00:00Z",
      "status": "open"
    }
  ]
}
EOF

# 2. Import votes data
echo ""
echo "# Import initial votes with chaprola_import (see documentation for full list)"

# 3. Build indexes
cat << 'EOF'

# Build indexes:
chaprola_index: project="poll", file="polls", field="poll_id"
chaprola_index: project="poll", file="polls", field="status"
chaprola_index: project="poll", file="votes", field="poll_id"
EOF

# 4. Compile programs
cat << 'EOF'

# Compile programs with chaprola_compile:
- POLLLIST.CS with primary_format="polls"
- POLLDETAIL.CS with primary_format="polls"
- RESULTS.CS with primary_format="votes"
EOF

# 5. Publish reports
cat << 'EOF'

# Publish with chaprola_publish:
- POLLLIST with primary_file="polls", acl="public"
- POLLDETAIL with primary_file="polls", acl="public"
- RESULTS with primary_file="votes", acl="public"
EOF

echo ""
echo "Report URLs:"
echo "- https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=POLLLIST"
echo "- https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=POLLDETAIL&poll_id=XXX"
echo "- https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=RESULTS&poll_id=XXX"
