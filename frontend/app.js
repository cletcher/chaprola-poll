// Shared utilities for Chaprola Poll

const ChaprolaPoll = {
  API_BASE: 'https://api.chaprola.org',
  PROXY_BASE: '/api/proxy',
  USERID: 'chaprola-poll',
  PROJECT: 'poll',

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatDate(isoDate) {
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
  },

  async fetchReport(name, params = {}) {
    const url = new URL(`${this.API_BASE}/report`);
    url.searchParams.set('userid', this.USERID);
    url.searchParams.set('project', this.PROJECT);
    url.searchParams.set('name', name);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  },

  async proxyRequest(data) {
    const response = await fetch(this.PROXY_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Request failed');
    }

    return result;
  }
};

// Export for modules or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChaprolaPoll;
} else {
  window.ChaprolaPoll = ChaprolaPoll;
}
