'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import StaffView from '@/components/StaffView';

export default function Staff({ params }) {
  const { slug } = params;
  const [pin, setPin] = useState('');
  const [authed, setAuthed] = useState(false);
  const [st, setSt] = useState(null);
  const [err, setErr] = useState('');
  const [walk, setWalk] = useState({ name: '', phone: '' });
  const [qr, setQr] = useState('');
  const [now, setNow] = useState(0);
  const pinRef = useRef('');

  const load = useCallback(async (p) => {
    const r = await fetch(`/api/staff/${slug}/state`, { headers: { 'x-staff-pin': p }, cache: 'no-store' });
    const d = await r.json();
    if (!r.ok) { setAuthed(false); setErr(d.error); sessionStorage.removeItem('nowait-pin'); return; }
    setSt(d); setAuthed(true); setErr('');
  }, [slug]);

  useEffect(() => {
    const saved = sessionStorage.getItem('nowait-pin');
    if (saved) { setPin(saved); pinRef.current = saved; load(saved); }
  }, [load]);

  useEffect(() => {
    if (!authed) return;
    setNow(Date.now());
    const poll = setInterval(() => load(pinRef.current), 4000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [authed, load]);

  useEffect(() => {
    if (!authed) return;
    import('qrcode')
      .then((Q) => Q.toDataURL(`${window.location.origin}/c/${slug}`, { width: 720, margin: 1, color: { dark: '#0C2B2E' } }))
      .then(setQr);
  }, [authed, slug]);

  const act = useCallback(async (action, extra = {}) => {
    const r = await fetch(`/api/staff/${slug}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-staff-pin': pinRef.current },
      body: JSON.stringify({ action, ...extra }),
    });
    const d = await r.json();
    if (!r.ok) { setErr(d.error || 'Something went wrong'); return false; }
    setErr(''); await load(pinRef.current); return true;
  }, [slug, load]);

  // Keyboard shortcuts for a busy desk: N = next, S = skip
  useEffect(() => {
    if (!authed) return;
    function onKey(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N') act('next');
      if (e.key === 's' || e.key === 'S') act('skip');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authed, act]);

  async function login(e) {
    e.preventDefault();
    pinRef.current = pin;
    sessionStorage.setItem('nowait-pin', pin);
    await load(pin);
  }

  async function addWalkin(e) {
    e.preventDefault();
    if (await act('walkin', { name: walk.name, phone: walk.phone })) setWalk({ name: '', phone: '' });
  }

  if (!authed) {
    return (
      <main className="s-login">
        <form className="s-login-box" onSubmit={login}>
          <h1>Reception desk</h1>
          <p>Enter your clinic PIN to open the queue.</p>
          <input className="s-pin" value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoFocus aria-label="Clinic PIN" />
          {err && <p className="s-login-err">{err}. Check the PIN and try again.</p>}
          <button className="j-go">Open queue</button>
        </form>
      </main>
    );
  }
  if (!st) return <main className="s-login"><p>Loading the queue…</p></main>;

  return <StaffView st={st} now={now || Date.now()} qr={qr} err={err} walk={walk} setWalk={setWalk} onAct={act} onWalkin={addWalkin} onPrint={() => window.print()} slug={slug} />;
}
