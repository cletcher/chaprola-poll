// Vercel Serverless Function - Chaprola Poll Proxy
// This proxy handles authenticated requests to Chaprola API

const CHAPROLA_API = 'https://api.chaprola.org';
const CHAPROLA_USERNAME = 'chaprola-poll';
// API key should be set as CHAPROLA_API_KEY environment variable in Vercel

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CHAPROLA_API_KEY;
  if (!apiKey) {
    console.error('CHAPROLA_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const body = req.body;
    const { action } = body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    let result;

    switch (action) {
      case 'vote':
        result = await handleVote(body, apiKey);
        break;
      case 'create_poll':
        result = await handleCreatePoll(body, apiKey);
        break;
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleVote(body, apiKey) {
  const { poll_id, option, voter_tag } = body;

  // Validate required fields
  if (!poll_id || typeof poll_id !== 'string') {
    throw new Error('Invalid poll_id');
  }
  if (!option || typeof option !== 'string') {
    throw new Error('Invalid option');
  }

  // Sanitize inputs
  const sanitizedPollId = poll_id.trim().substring(0, 12);
  const sanitizedOption = option.trim().substring(0, 100);
  const sanitizedVoterTag = (voter_tag || '').trim().substring(0, 50);
  const votedAt = new Date().toISOString();

  // Call Chaprola insert_record
  const response = await fetch(`${CHAPROLA_API}/insert_record`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userid: CHAPROLA_USERNAME,
      project: 'poll',
      file: 'votes',
      record: {
        poll_id: sanitizedPollId,
        option: sanitizedOption,
        voter_tag: sanitizedVoterTag,
        voted_at: votedAt
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Chaprola error:', error);
    throw new Error('Failed to record vote');
  }

  return { status: 'ok', message: 'Vote recorded' };
}

async function handleCreatePoll(body, apiKey) {
  const { poll_id, title, options, created_by } = body;

  // Validate required fields
  if (!poll_id || typeof poll_id !== 'string' || poll_id.length < 4) {
    throw new Error('Invalid poll_id');
  }
  if (!title || typeof title !== 'string' || title.length < 3) {
    throw new Error('Title must be at least 3 characters');
  }
  if (!options || typeof options !== 'string') {
    throw new Error('Invalid options');
  }
  if (!created_by || typeof created_by !== 'string') {
    throw new Error('Invalid created_by');
  }

  // Validate options count
  const optionList = options.split('|').filter(o => o.trim());
  if (optionList.length < 2) {
    throw new Error('Poll must have at least 2 options');
  }
  if (optionList.length > 10) {
    throw new Error('Poll cannot have more than 10 options');
  }

  // Sanitize inputs
  const sanitizedPollId = poll_id.trim().substring(0, 11);
  const sanitizedTitle = title.trim().substring(0, 100);
  const sanitizedOptions = optionList.map(o => o.trim().substring(0, 100)).join('|');
  const sanitizedCreatedBy = created_by.trim().substring(0, 50);
  const createdAt = new Date().toISOString();

  // Call Chaprola insert_record
  const response = await fetch(`${CHAPROLA_API}/insert_record`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userid: CHAPROLA_USERNAME,
      project: 'poll',
      file: 'polls',
      record: {
        poll_id: sanitizedPollId,
        title: sanitizedTitle,
        options: sanitizedOptions,
        created_by: sanitizedCreatedBy,
        created_at: createdAt,
        status: 'open'
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Chaprola error:', error);
    throw new Error('Failed to create poll');
  }

  return { status: 'ok', poll_id: sanitizedPollId, message: 'Poll created' };
}
