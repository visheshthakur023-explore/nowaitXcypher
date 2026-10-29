// Alerts: WhatsApp via Twilio, with SMS fallback. Without Twilio keys it only logs (dry run).

export function normalizePhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) return '+91' + d;          // assume India for 10-digit numbers
  if (d.length > 10 && d.length <= 15) return '+' + d;
  return null;
}

async function twilioSend(from, to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  if (!res.ok) console.error('Twilio error', res.status, await res.text());
  return res.ok;
}

export async function sendAlert(to, body) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TWILIO_SMS_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    console.log('[alert dry-run]', to, '->', body);
    return 'dry-run';
  }
  try {
    if (await twilioSend(`whatsapp:${TWILIO_WHATSAPP_FROM}`, `whatsapp:${to}`, body)) return 'whatsapp';
  } catch (e) { console.error('WhatsApp send failed', e); }
  if (TWILIO_SMS_FROM) {
    try { if (await twilioSend(TWILIO_SMS_FROM, to, body)) return 'sms'; } catch (e) { console.error('SMS failed', e); }
  }
  return 'failed';
}
