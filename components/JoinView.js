export const JT = {
  en: {
    lang: 'हिंदी', empty: 'No one is waiting. You would be next.',
    ahead: (n, m) => `${n} ${n === 1 ? 'person is' : 'people are'} ahead of you. About ${m} min.`,
    paused: 'The queue is paused right now. You can still take a token.',
    name: 'Your name', phone: 'WhatsApp number', help: 'We message you when 3 people are ahead of you. No app to install.',
    go: 'Get my token', busy: 'Getting your token…',
  },
  hi: {
    lang: 'English', empty: 'अभी कोई इंतज़ार में नहीं है। आप अगले होंगे।',
    ahead: (n, m) => `आपसे आगे ${n} लोग हैं। लगभग ${m} मिनट।`,
    paused: 'कतार अभी रुकी है। फिर भी आप टोकन ले सकते हैं।',
    name: 'आपका नाम', phone: 'WhatsApp नंबर', help: 'जब आपसे आगे 3 लोग रह जाएँगे, हम संदेश भेजेंगे। कोई ऐप नहीं चाहिए।',
    go: 'मेरा टोकन लें', busy: 'टोकन बन रहा है…',
  },
};

export default function JoinView({ info, lang, onToggleLang, form, setForm, onSubmit, busy, err }) {
  const t = JT[lang];
  const n = info ? info.inQueue : 0;
  const dots = Array.from({ length: 12 }, (_, i) => i < n);
  return (
    <main className="j-screen">
      <div className="j-rings" />
      <div className="j-hero">
        <div className="j-top"><button className="pill" onClick={onToggleLang}>{t.lang}</button></div>
        <h1 className="j-name">{info ? info.name : ' '}</h1>
        <div className="j-dots" aria-hidden="true">{dots.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}{n > 12 && <span>+{n - 12}</span>}</div>
        <p className="j-line">{info ? (n === 0 ? t.empty : t.ahead(n, info.estMinutes)) : ' '}</p>
        {info && info.paused && <p className="j-line j-paused">{t.paused}</p>}
      </div>
      <form className="j-sheet" onSubmit={onSubmit}>
        <div className="j-sheet-in">
          <label className="j-field">
            <span>{t.name}</span>
            <input className="j-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required />
          </label>
          <label className="j-field">
            <span>{t.phone}</span>
            <div className="j-phone"><b>+91</b>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" required />
            </div>
          </label>
          <p className="j-help">{t.help}</p>
          {err && <p className="j-err">{err}</p>}
          <button className="j-go" disabled={busy}>{busy ? t.busy : t.go}</button>
        </div>
      </form>
    </main>
  );
}
