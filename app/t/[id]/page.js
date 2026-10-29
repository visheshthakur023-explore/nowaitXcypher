'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientView, { modeOf } from '@/components/PatientView';
import { useLang } from '@/lib/useLang';

export default function Live({ params }) {
  const router = useRouter();
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [lang, toggleLang] = useLang();
  const prevMode = useRef(null);

  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const r = await fetch('/api/token/' + params.id, { cache: 'no-store' });
        const d = await r.json();
        if (stop) return;
        if (r.ok) { setS(d); setErr(''); } else setErr(d.error);
      } catch { /* keep the last values during a network blip */ }
    }
    tick();
    const h = setInterval(tick, 5000);
    return () => { stop = true; clearInterval(h); };
  }, [params.id]);

  useEffect(() => {
    if (!s) return;
    const mode = modeOf(s);
    document.title = s.status === 'serving' ? `Your turn · #${s.tokenNumber}` : `#${s.tokenNumber} · ${s.ahead} ahead`;
    // buzz the phone when the situation changes to "almost" or "your turn"
    if (prevMode.current && prevMode.current !== mode && (mode === 'near' || mode === 'turn')) {
      if (navigator.vibrate) navigator.vibrate([250, 120, 250]);
    }
    prevMode.current = mode;
  }, [s]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'NoWait', url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* user closed the share sheet */ }
  }

  function again() {
    localStorage.removeItem('nowait:' + s.slug);
    router.push('/c/' + s.slug);
  }

  if (err) return <main className="j-screen"><div className="j-hero"><p className="j-line">{err}. Please scan the clinic QR code again.</p></div></main>;
  if (!s) return <main className="j-screen"><div className="j-hero"><p className="j-line">Loading your token…</p></div></main>;
  return <PatientView s={s} lang={lang} onToggleLang={toggleLang} onShare={share} copied={copied} onAgain={again} />;
}
