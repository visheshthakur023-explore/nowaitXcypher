const fmt = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

export default function StaffView({ st, now, qr, err, walk, setWalk, onAct, onWalkin, onPrint, slug }) {
  const avgMs = st.avgMinutes * 60000;
  const serving = st.serving;
  const elapsed = serving && serving.calledAt ? now - serving.calledAt : 0;
  const pct = serving ? Math.min(100, (elapsed / avgMs) * 100) : 0;
  const level = elapsed > avgMs * 1.5 ? 'over' : elapsed > avgMs ? 'long' : 'ok';
  const next = st.waiting[0];
  const longest = st.waiting.length
    ? Math.max(0, Math.floor((now - Math.min(...st.waiting.map((w) => w.createdAt))) / 60000))
    : 0;

  return (
    <div className="s-app">
      <header className="s-top">
        <span className="s-brand">NoWait</span>
        <span className="s-clinic">{st.clinicName}</span>
        <span className="s-live"><i />Live</span>
        <span className="s-spacer" />
        <button className="s-pill" onClick={() => onAct(st.paused ? 'resume' : 'pause')}>
          {st.paused ? 'Resume alerts' : 'Pause queue'}
        </button>
        <button className="s-pill" onClick={onPrint}>Print QR poster</button>
      </header>
      {st.paused && <div className="s-paused">Queue paused. Patients will not get alerts until you resume.</div>}

      <section className="s-stats">
        <div><b>{st.waiting.length}</b><span>Waiting</span></div>
        <div><b>{st.servedToday}</b><span>Seen today</span></div>
        <div><b>{st.avgMinutes}<small> min</small></b><span>Average visit</span></div>
        <div><b>{longest}<small> min</small></b><span>Longest wait</span></div>
      </section>

      {err && <p className="s-err">{err}</p>}

      <div className="s-main">
        <div>
          <section className="s-now">
            <div className="s-now-label">Now seeing</div>
            {serving ? (
              <>
                <div className="s-now-num">{serving.token_number}</div>
                <div className="s-now-name">{serving.patient_name}</div>
                <div className="s-timer">
                  <div className="s-timer-row"><span>In the room</span><b>{fmt(elapsed)}</b></div>
                  <div className="s-bar" data-level={level}><i style={{ width: pct + '%' }} /></div>
                </div>
              </>
            ) : (
              <>
                <div className="s-now-num s-now-none">–</div>
                <div className="s-now-name">{next ? `Room is free. #${next.token_number} is next.` : 'Room is free.'}</div>
              </>
            )}
            <button className="s-call" onClick={() => onAct('next')} disabled={!serving && !next}>
              {serving ? (next ? `Finish and call #${next.token_number}` : 'Finish visit') : next ? `Call #${next.token_number}` : 'No one to call'}
              <kbd>N</kbd>
            </button>
            <div className="s-secondary">
              <button onClick={() => onAct('skip')} disabled={!serving}>Skip this patient <kbd>S</kbd></button>
            </div>
          </section>

          <form className="s-walk" onSubmit={onWalkin}>
            <h2>Add a walk-in</h2>
            <input value={walk.name} onChange={(e) => setWalk({ ...walk, name: e.target.value })} placeholder="Patient name" required />
            <input value={walk.phone} onChange={(e) => setWalk({ ...walk, phone: e.target.value })} placeholder="Phone (optional, for WhatsApp alerts)" inputMode="tel" />
            <button>Add to queue</button>
          </form>

          <div className="s-qr">
            {qr && <img src={qr} alt="QR code patients scan to join" />}
            <div>
              <b>Door QR code</b>
              <p>Patients scan it to get a token. Print it and stick it at the entrance.</p>
              <button className="s-link" onClick={onPrint}>Print poster</button>
            </div>
          </div>
        </div>

        <section>
          <div className="s-queue-head"><h2>Waiting</h2><span>{st.waiting.length} in line</span></div>
          {st.waiting.length === 0 ? (
            <p className="s-none">No one is waiting. Patients who scan the QR code will appear here within a few seconds.</p>
          ) : (
            <ol className="s-list">
              {st.waiting.map((w, i) => {
                const waited = Math.max(0, Math.floor((now - w.createdAt) / 60000));
                return (
                  <li key={w.id} className="s-row" data-next={i === 0}>
                    <span className="s-row-num">{w.token_number}</span>
                    <span className="s-row-who">
                      <b>{w.patient_name}</b>
                      <small>
                        {i === 0 ? 'Next up. ' : ''}{w.source === 'staff' ? 'Added at the desk' : 'Scanned the QR code'}
                        {w.phone ? '' : ', no phone'}
                      </small>
                    </span>
                    <span className="s-row-time">
                      <b>~{w.estMinutes} min</b>
                      <small>{waited === 0 ? 'just joined' : `waiting ${waited} min`}</small>
                      {w.alerted && <em className="s-chip">Alert sent</em>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <div className="s-poster" aria-hidden="true">
        <h1>{st.clinicName}</h1>
        <p className="s-poster-big">Scan to get your token</p>
        <p className="s-poster-hi">टोकन पाने के लिए स्कैन करें</p>
        {qr && <img src={qr} alt="" />}
        <p>No app needed. We message you on WhatsApp when your turn is near.</p>
        <p>आपका नंबर पास आने पर हम WhatsApp पर संदेश भेजेंगे।</p>
      </div>
    </div>
  );
}
