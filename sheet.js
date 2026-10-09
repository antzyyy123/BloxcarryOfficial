// sheet.js: shared loader. Paste your Apps Script Web app URL below (see SETUP.md).
const API_URL = 'https://script.google.com/macros/s/AKfycbz3S5K--lXW_n070A7Dq8ZkjrHVdtiatPgFa_DhDJxKLevjVIXOKpDHQsYoEFtpyZ6Nnw/exec';
const SheetAPI = (() => {
  const cget = () => { try { return JSON.parse(localStorage.getItem('bc_public')); } catch (e) { return null; } };
  async function pub() {
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(API_URL + '?action=public', { signal: ctl.signal }); clearTimeout(t);
      const d = await r.json(); if (!d.services) throw 0;
      try { localStorage.setItem('bc_public', JSON.stringify(d)); } catch (e) {}
      return d;
    } catch (e) { return cget(); } // sheet unreachable: use last good copy
  }
  const post = async body => (await fetch(API_URL, { method: 'POST', body: JSON.stringify(body) })).json();
  return { services: async () => (await pub())?.services, team: async () => (await pub())?.team, post };
})();