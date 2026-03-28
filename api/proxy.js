// Vercel Serverless Function - Proxy for Chaprola API
// This function handles authenticated requests to insert votes and create polls

const CHAPROLA_API = 'https://api.chaprola.org';
const CHAPROLA_USERNAME = process.env.CHAPROLA_USERNAME || 'chaprola-poll';
const CHAPROLA_API_KEY = process.env.CHAPROLA_API_KEY;
const PROJECT = 'poll';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!CHAPROLA_API_KEY) {
        console.error('CHAPROLA_API_KEY not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const body = req.body;
        const action = body.action;

        if (action === 'vote') {
            // Validate vote data
            const { poll_id, option, voter_tag, voted_at } = body;

            if (!poll_id || typeof poll_id !== 'string' || poll_id.length > 12) {
                return res.status(400).json({ error: 'Invalid poll_id' });
            }

            if (!option || typeof option !== 'string' || option.length > 100) {
                return res.status(400).json({ error: 'Invalid option' });
            }

            // Insert vote record
            const insertResponse = await fetch(`${CHAPROLA_API}/insert-record`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CHAPROLA_API_KEY}`
                },
                body: JSON.stringify({
                    userid: CHAPROLA_USERNAME,
                    project: PROJECT,
                    file: 'votes',
                    record: {
                        poll_id: poll_id.substring(0, 12),
                        option: option.substring(0, 100),
                        voter_tag: (voter_tag || '').substring(0, 50),
                        voted_at: voted_at || new Date().toISOString()
                    }
                })
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                console.error('Chaprola insert error:', errorText);
                return res.status(500).json({ error: 'Failed to record vote' });
            }

            const result = await insertResponse.json();
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json({ status: 'ok', message: 'Vote recorded' });

        } else if (action === 'create') {
            // Validate poll data
            const { poll_id, title, options, created_by, created_at, status } = body;

            if (!poll_id || typeof poll_id !== 'string' || poll_id.length > 12) {
                return res.status(400).json({ error: 'Invalid poll_id' });
            }

            if (!title || typeof title !== 'string' || title.length > 100) {
                return res.status(400).json({ error: 'Invalid title' });
            }

            if (!options || typeof options !== 'string' || options.length > 500) {
                return res.status(400).json({ error: 'Invalid options' });
            }

            // Insert poll record
            const insertResponse = await fetch(`${CHAPROLA_API}/insert-record`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CHAPROLA_API_KEY}`
                },
                body: JSON.stringify({
                    userid: CHAPROLA_USERNAME,
                    project: PROJECT,
                    file: 'polls',
                    record: {
                        poll_id: poll_id.substring(0, 12),
                        title: title.substring(0, 100),
                        options: options.substring(0, 500),
                        created_by: (created_by || 'anonymous').substring(0, 50),
                        created_at: created_at || new Date().toISOString(),
                        status: status || 'open'
                    }
                })
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                console.error('Chaprola insert error:', errorText);
                return res.status(500).json({ error: 'Failed to create poll' });
            }

            const result = await insertResponse.json();
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json({ status: 'ok', poll_id: poll_id });

        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
