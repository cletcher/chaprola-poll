// Chaprola Poll - Frontend JavaScript
// API Configuration
const API_BASE = 'https://api.chaprola.org';
const REPORT_BASE = `${API_BASE}/report`;
const PROXY_URL = '/api/proxy'; // Will be deployed as a serverless function
const USERID = 'chaprola-poll';
const PROJECT = 'poll';

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper: Format date
function formatDate(isoDate) {
    try {
        const date = new Date(isoDate);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return isoDate;
    }
}

// Helper: Generate short poll ID (8 chars, alphanumeric)
function generatePollId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

// Helper: Get query parameter
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Parse Chaprola report output (pipe-delimited, may have trailing data)
function parseReportLine(line, expectedFields) {
    // Split by pipe and take only the expected number of fields
    const parts = line.split('|');
    return parts.slice(0, expectedFields);
}

// Fetch list of open polls
async function fetchPolls() {
    const url = `${REPORT_BASE}?userid=${USERID}&project=${PROJECT}&name=POLLLIST`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch polls');

    const text = await response.text();
    const lines = text.trim().split('\n').filter(line => line.startsWith('POLL|'));

    return lines.map(line => {
        const parts = parseReportLine(line, 5);
        // POLL|poll_id|title|options|created_at
        return {
            pollId: (parts[1] || '').trim(),
            title: (parts[2] || '').trim(),
            options: (parts[3] || '').split('|').filter(o => o.trim()),
            optionCount: (parts[3] || '').split('|').filter(o => o.trim()).length,
            createdAt: (parts[4] || '').trim()
        };
    });
}

// Fetch poll details
async function fetchPollDetail(pollId) {
    const url = `${REPORT_BASE}?userid=${USERID}&project=${PROJECT}&name=POLLDETAIL&poll_id=${encodeURIComponent(pollId)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch poll');

    const text = await response.text();
    const lines = text.trim().split('\n');

    const poll = {
        title: '',
        options: [],
        status: ''
    };

    for (const line of lines) {
        if (line.startsWith('TITLE|')) {
            poll.title = parseReportLine(line, 2)[1].trim();
        } else if (line.startsWith('OPTIONS|')) {
            // Options are after OPTIONS| and are pipe-delimited
            const optionStr = line.substring(8).trim();
            // Find where the actual options end (before any trailing data)
            // Options shouldn't contain spaces at the start, so find first clean split
            poll.options = optionStr.split('|').map(o => o.trim()).filter(o => o && !o.includes('  '));
        } else if (line.startsWith('STATUS|')) {
            poll.status = parseReportLine(line, 2)[1].trim();
        }
    }

    return poll;
}

// Fetch poll results
async function fetchResults(pollId) {
    const url = `${REPORT_BASE}?userid=${USERID}&project=${PROJECT}&name=RESULTS&poll_id=${encodeURIComponent(pollId)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch results');

    const text = await response.text();
    const lines = text.trim().split('\n');

    const votes = [];
    let total = 0;

    for (const line of lines) {
        if (line.startsWith('VOTE|')) {
            const parts = parseReportLine(line, 3);
            votes.push({
                option: (parts[1] || '').trim(),
                voterTag: (parts[2] || '').trim()
            });
        } else if (line.startsWith('TOTAL|')) {
            const parts = parseReportLine(line, 2);
            total = parseInt((parts[1] || '0').trim(), 10);
        }
    }

    // Aggregate votes by option
    const counts = {};
    const byTag = {};

    for (const vote of votes) {
        counts[vote.option] = (counts[vote.option] || 0) + 1;

        if (vote.voterTag) {
            if (!byTag[vote.option]) byTag[vote.option] = {};
            byTag[vote.option][vote.voterTag] = (byTag[vote.option][vote.voterTag] || 0) + 1;
        }
    }

    // Get unique voter tags
    const allTags = new Set();
    for (const vote of votes) {
        if (vote.voterTag) allTags.add(vote.voterTag);
    }

    return {
        total,
        counts,
        byTag,
        voterTags: Array.from(allTags).sort()
    };
}

// Submit a vote via proxy
async function submitVote(pollId, option, voterTag) {
    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'vote',
            poll_id: pollId,
            option: option,
            voter_tag: voterTag || '',
            voted_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to submit vote');
    }

    return response.json();
}

// Create a new poll via proxy
async function createPoll(title, options, createdBy) {
    const pollId = generatePollId();

    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'create',
            poll_id: pollId,
            title: title,
            options: options.join('|'),
            created_by: createdBy,
            created_at: new Date().toISOString(),
            status: 'open'
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to create poll');
    }

    return { pollId };
}
