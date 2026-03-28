// Cloudflare Worker - Proxy for Chaprola API
// Deploy with: wrangler deploy
// Set secrets: wrangler secret put CHAPROLA_API_KEY

const CHAPROLA_API = 'https://api.chaprola.org';
const CHAPROLA_USERNAME = 'chaprola-poll';
const PROJECT = 'poll';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 200, headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: corsHeaders
            });
        }

        const apiKey = env.CHAPROLA_API_KEY;
        if (!apiKey) {
            console.error('CHAPROLA_API_KEY not configured');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: corsHeaders
            });
        }

        try {
            const body = await request.json();
            const action = body.action;

            if (action === 'vote') {
                // Validate vote data
                const { poll_id, option, voter_tag, voted_at } = body;

                if (!poll_id || typeof poll_id !== 'string' || poll_id.length > 12) {
                    return new Response(JSON.stringify({ error: 'Invalid poll_id' }), {
                        status: 400,
                        headers: corsHeaders
                    });
                }

                if (!option || typeof option !== 'string' || option.length > 100) {
                    return new Response(JSON.stringify({ error: 'Invalid option' }), {
                        status: 400,
                        headers: corsHeaders
                    });
                }

                // Insert vote record
                const insertResponse = await fetch(`${CHAPROLA_API}/insert-record`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
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
                    return new Response(JSON.stringify({ error: 'Failed to record vote' }), {
                        status: 500,
                        headers: corsHeaders
                    });
                }

                return new Response(JSON.stringify({ status: 'ok', message: 'Vote recorded' }), {
                    status: 200,
                    headers: corsHeaders
                });

            } else if (action === 'create') {
                // Validate poll data
                const { poll_id, title, options, created_by, created_at, status } = body;

                if (!poll_id || typeof poll_id !== 'string' || poll_id.length > 12) {
                    return new Response(JSON.stringify({ error: 'Invalid poll_id' }), {
                        status: 400,
                        headers: corsHeaders
                    });
                }

                if (!title || typeof title !== 'string' || title.length > 100) {
                    return new Response(JSON.stringify({ error: 'Invalid title' }), {
                        status: 400,
                        headers: corsHeaders
                    });
                }

                if (!options || typeof options !== 'string' || options.length > 500) {
                    return new Response(JSON.stringify({ error: 'Invalid options' }), {
                        status: 400,
                        headers: corsHeaders
                    });
                }

                // Insert poll record
                const insertResponse = await fetch(`${CHAPROLA_API}/insert-record`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
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
                    return new Response(JSON.stringify({ error: 'Failed to create poll' }), {
                        status: 500,
                        headers: corsHeaders
                    });
                }

                return new Response(JSON.stringify({ status: 'ok', poll_id: poll_id }), {
                    status: 200,
                    headers: corsHeaders
                });

            } else {
                return new Response(JSON.stringify({ error: 'Invalid action' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }
};
