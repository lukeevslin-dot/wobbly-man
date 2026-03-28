import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const LOCAL_KEY = 'wobbly_lb_v1';

export class Leaderboard {
  get online() { return !!(SUPABASE_URL && SUPABASE_ANON_KEY); }

  // ── Local (always works) ─────────────────────────────────
  _saveLocal(name, score) {
    try {
      const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      arr.push({ name, score });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
    } catch {}
  }

  _getLocalTop(limit = 10) {
    try {
      const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      return arr.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch { return []; }
  }

  // ── Remote (Supabase, when configured) ──────────────────
  async submit(name, score) {
    this._saveLocal(name, score);
    if (!this.online) return;
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
    if (!this.online) return this._getLocalTop(limit);
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?select=name,score&order=score.desc&limit=${limit}`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
      );
      return r.ok ? r.json() : this._getLocalTop(limit);
    } catch { return this._getLocalTop(limit); }
  }
}
