// Client-side API wrapper for Chaprola Poll
// Uses an origin-locked site key — safe to embed in frontend JavaScript.
// This key only works from https://chaprola.org/apps/chaprola-poll/* and
// is restricted to /insert-record, /query, and /report endpoints.

const ChaprolaProxy = {
  API_BASE: 'https://api.chaprola.org',
  USERID: 'chaprola-poll',
  PROJECT: 'poll',
  API_KEY: 'site_ae3401111ffb83939527e70b4fb1eae1e1dbdc71804077828d88e3e14c9990c2',

  async vote(pollId, option, voterTag = '') {
    const response = await fetch(`${this.API_BASE}/insert-record`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userid: this.USERID,
        project: this.PROJECT,
        file: 'votes',
        record: {
          poll_id: pollId.trim().substring(0, 11),
          option: option.trim().substring(0, 24),
          voter_tag: (voterTag || '').trim().substring(0, 24),
          voted_at: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to record vote: ${error}`);
    }

    return { status: 'ok', message: 'Vote recorded' };
  },

  async createPoll(pollId, title, options, createdBy, ownerSub) {
    // Validate
    if (!pollId || pollId.length < 4) throw new Error('Invalid poll_id');
    if (!title || title.length < 3) throw new Error('Title too short');

    const optionList = options.split('|').filter(o => o.trim());
    if (optionList.length < 2) throw new Error('Need at least 2 options');
    if (optionList.length > 10) throw new Error('Max 10 options');

    const response = await fetch(`${this.API_BASE}/insert-record`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userid: this.USERID,
        project: this.PROJECT,
        file: 'polls',
        record: {
          poll_id: pollId.trim().substring(0, 11),
          title: title.trim().substring(0, 39),
          options: optionList.map(o => o.trim().substring(0, 20)).join('|'),
          created_by: createdBy.trim().substring(0, 21),
          owner_sub: (ownerSub || 'demo-user').trim().substring(0, 40),
          created_at: new Date().toISOString(),
          status: 'open'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create poll: ${error}`);
    }

    return { status: 'ok', poll_id: pollId, message: 'Poll created' };
  }
};

// Expose globally
window.ChaprolaProxy = ChaprolaProxy;
