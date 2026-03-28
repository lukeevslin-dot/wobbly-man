import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

export class Leaderboard {
  get enabled() { return !!(SUPABASE_URL && SUPABASE_ANON_KEY); }

  async submit(name, score) {
    if (!this.enabled) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ name, score }),
      });
    } catch (e) { console.warn('Leaderboard submit failed:', e); }
  }

  async getTop(limit = 10) {
    if (!this.enabled) return [];
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?select=name,score&order=score.desc&limit=${limit}`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
      );
      return r.ok ? r.json() : [];
    } catch (e) { return []; }
  }
}
