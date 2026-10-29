'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import JoinView from '@/components/JoinView';
import { useLang } from '@/lib/useLang';

export default function Join({ params }) {
  const { slug } = params;
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [lang, toggleLang] = useLang();

  // Returning patient with a live token goes straight back to it.
  useEffect(() => {
    (async () => {
      const saved = localStorage.getItem('nowait:' + slug);
      if (!saved) return;
      try {
        const r = await fetch('/api/token/' + saved, { cache: 'no-store' });
        if (r.ok) {
          const d = await r.json();
          if (d.status === 'waiting' || d.status === 'serving') { router.replace('/t/' + saved); return; }
        }
        localStorage.removeItem('nowait:' + slug); // finished, skipped or unknown token
      } catch { /* offline: keep it */ }
    })();
  }, [slug, router]);

  // Live queue size shown before joining.
  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const r = await fetch('/api/clinic/' + slug, { cache: 'no-store' });
        const d = await r.json();
        if (stop) return;
        if (r.ok) setInfo(d); else setErr(d.error);
      } catch { /* ignore */ }
    }
    load();
    const h = setInterval(load, 8000);
    return () => { stop = true; clearInterval(h); };
  }, [slug]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name: form.name, phone: form.phone }),
    });
    const d = await r.json();
    if (!r.ok) { setErr(d.error || 'Something went wrong'); setBusy(false); return; }
    localStorage.setItem('nowait:' + slug, String(d.id));
    router.push('/t/' + d.id);
  }

  return <JoinView info={info} lang={lang} onToggleLang={toggleLang} form={form} setForm={setForm} onSubmit={submit} busy={busy} err={err} />;
}
