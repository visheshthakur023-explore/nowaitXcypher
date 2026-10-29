export default function Home() {
  return (
    <main className="j-screen">
      <div className="j-rings" />
      <div className="j-hero">
        <h1 className="j-name">NoWait</h1>
        <p className="j-line">Wait anywhere. We will message you when your turn is near.</p>
        <div className="h-links">
          <a className="j-go h-btn" href="/c/sample-clinic">Open the patient view</a>
          <a className="h-btn h-ghost" href="/staff/sample-clinic">Open the reception desk (PIN 1234)</a>
        </div>
      </div>
    </main>
  );
}
