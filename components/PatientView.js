export const PT = {
  en: {
    lang: 'हिंदी', yourToken: 'Your token', ahead: 'Ahead of you', wait: 'Est. wait', serving: 'Now serving', min: 'min',
    waitTitle: 'You can wait anywhere', waitSub: 'Keep this page open, or wait for our WhatsApp message.',
    nearTitle: 'Almost your turn', nearSub: 'Please start heading to the clinic.',
    turnTitle: "It's your turn", turnSub: 'Please go in now.',
    doneTitle: 'All done', doneSub: 'Thank you for visiting. Take care.',
    skippedTitle: 'We missed you', skippedSub: 'Please speak to the reception to get a new spot.',
    paused: 'The queue is paused for a moment. Your place is safe.',
    again: 'Join again', share: 'Share this link', copied: 'Link copied',
    door: 'Doctor', you: 'You', more: (n) => `+${n} more`,
  },
  hi: {
    lang: 'English', yourToken: 'आपका टोकन', ahead: 'आपसे आगे', wait: 'अनुमानित समय', serving: 'अभी चल रहा', min: 'मिनट',
    waitTitle: 'आप कहीं भी इंतज़ार कर सकते हैं', waitSub: 'यह पेज खुला रखें, या हमारे WhatsApp संदेश का इंतज़ार करें।',
    nearTitle: 'लगभग आपकी बारी', nearSub: 'कृपया क्लिनिक की ओर निकलें।',
    turnTitle: 'आपकी बारी है', turnSub: 'कृपया अभी अंदर जाएँ।',
    doneTitle: 'हो गया', doneSub: 'आने के लिए धन्यवाद। अपना ध्यान रखें।',
    skippedTitle: 'आप छूट गए', skippedSub: 'नई जगह के लिए कृपया रिसेप्शन से बात करें।',
    paused: 'कतार कुछ देर के लिए रुकी है। आपकी जगह सुरक्षित है।',
    again: 'फिर से जुड़ें', share: 'लिंक शेयर करें', copied: 'लिंक कॉपी हुआ',
    door: 'डॉक्टर', you: 'आप', more: (n) => `+${n} और`,
  },
};

export function modeOf(s) {
  if (s.status === 'serving') return 'turn';
  if (s.status === 'done') return 'done';
  if (s.status === 'skipped') return 'skipped';
  return s.ahead <= 3 ? 'near' : 'wait';
}

// The line of people between the doctor's door and you.
function Track({ s, t }) {
  const others = Math.max(0, s.ahead - (s.nowServing ? 1 : 0));
  const shown = Math.min(others, 5);
  const hidden = others - shown;
  return (
    <ol className="p-track">
      <li className="p-node p-node-door"><span className="p-dot" /><span>{t.door}</span></li>
      {s.nowServing && (
        <li className="p-node p-node-serving"><span className="p-dot" /><span>{t.serving} <b>#{s.nowServing}</b></span></li>
      )}
      {Array.from({ length: shown }).map((_, i) => (
        <li key={i} className="p-node p-node-wait"><span className="p-dot" /></li>
      ))}
      {hidden > 0 && <li className="p-node p-node-more"><span className="p-dot" /><span>{t.more(hidden)}</span></li>}
      <li className="p-node p-node-you"><span className="p-dot" /><span>{t.you} <b>#{s.tokenNumber}</b></span></li>
    </ol>
  );
}

export default function PatientView({ s, lang, onToggleLang, onShare, copied, onAgain }) {
  const t = PT[lang];
  const mode = modeOf(s);
  const [title, sub] = {
    wait: [t.waitTitle, t.waitSub],
    near: [t.nearTitle, t.nearSub],
    turn: [t.turnTitle, t.turnSub],
    done: [t.doneTitle, t.doneSub],
    skipped: [t.skippedTitle, t.skippedSub],
  }[mode];
  const waiting = s.status === 'waiting';
  const ended = mode === 'done' || mode === 'skipped';

  return (
    <main className="p-screen" data-mode={mode}>
      <div className="p-col">
        <header className="p-top">
          <span className="p-clinic">{s.clinicName}</span>
          <button className="pill" onClick={onToggleLang}>{t.lang}</button>
        </header>

        <section>
          <h1 className="p-title">{title}</h1>
          <p className="p-sub">{sub}</p>
        </section>

        <div className="p-ticket-wrap">
          <div className={waiting ? 'p-ticket' : 'p-ticket p-ticket-plain'}>
            <div className="p-ticket-top">
              <span className="p-ticket-label">{t.yourToken}</span>
              <span className="p-number"><span className="p-hash">#</span>{s.tokenNumber}</span>
              <span className="p-name">{s.name}</span>
            </div>
            {waiting && (
              <div className="p-stub">
                <div><span className="p-stat">{s.ahead}</span><span className="p-stat-label">{t.ahead}</span></div>
                <div><span className="p-stat">~{s.estMinutes}<small> {t.min}</small></span><span className="p-stat-label">{t.wait}</span></div>
                <div><span className="p-stat">{s.nowServing ? '#' + s.nowServing : '–'}</span><span className="p-stat-label">{t.serving}</span></div>
              </div>
            )}
          </div>
        </div>

        {waiting && <Track s={s} t={t} />}
        {waiting && s.paused && <p className="p-note">{t.paused}</p>}

        {ended ? (
          <button className="p-again" onClick={onAgain}>{t.again}</button>
        ) : (
          <button className="p-link" onClick={onShare}>{copied ? t.copied : t.share}</button>
        )}
      </div>
    </main>
  );
}
