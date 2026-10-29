# NoWait: virtual queue for small clinics

Next.js (screens + API in one app) + MongoDB Atlas + Twilio WhatsApp (optional).

## Quick start on your laptop (2 minutes, no database needed)
Needs Node.js 18.17 or newer (check with `node -v`; install from nodejs.org if needed).

    npm install
    copy .env.example .env      (Mac/Linux: cp .env.example .env)
    npm run dev

Open http://localhost:3000

- Staff screen: http://localhost:3000/staff/sample-clinic   PIN: 1234
- Patient page: http://localhost:3000/c/sample-clinic
  Open it in 2-3 tabs (use an incognito window for each so they act as different patients), join with different names and phone numbers.
- On the staff screen tap **Call next**. Patient pages update within 5 seconds.
- The "your turn is near" alert is printed in the terminal as `[alert dry-run]`.

With `MONGODB_URI` empty this runs in DEMO MODE: data lives in memory and is wiped when you stop the server.

To test on real phones on the same Wi-Fi: find your laptop IP (Windows: `ipconfig`) and open http://YOUR-IP:3000/c/sample-clinic on the phone. Run with `npm run dev -- -H 0.0.0.0`.

## Turn on MongoDB (data saved permanently)
1. MongoDB Atlas > create a free M0 cluster (or use your existing one).
2. Database Access > add a database user (username + password).
3. Network Access > Add IP Address > "Allow access from anywhere" (0.0.0.0/0). Needed for Render later.
4. Connect > Drivers > copy the connection string, replace `<password>`.
5. Paste into `.env` as `MONGODB_URI=...`, restart `npm run dev`.
Collections (`clinics`, `tokens`, `counters`) and the sample clinic are created automatically.

## Real WhatsApp alerts (Twilio sandbox)
1. Create a Twilio account > Messaging > Try it out > Send a WhatsApp message.
2. Every tester sends the sandbox join code to the Twilio WhatsApp number from their own WhatsApp (sandbox rule).
3. Fill `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` in `.env`, restart.

## Deploy on Render (one service runs everything)
1. Push this folder to a GitHub repo.
2. Render > New > Web Service > pick the repo.
3. Build command: `npm install && npm run build`   Start command: `npm start`
4. Environment variables: `MONGODB_URI`, `MONGODB_DB`, `BASE_URL` (your Render URL), plus the Twilio ones.
5. Free Render services sleep after ~15 min idle (first load can take about 50 seconds). Open the URL once just before a demo.

Netlify is not needed: the screens and the API are one Next.js app, so Render alone is enough.

## How the queue works
- Token numbers restart each day per clinic (India time). Each token has a random unguessable link.
- Patients ahead = people waiting or being served with a lower token number.
- Estimated wait = patients ahead x average of the last 10 finished consults (default 6 min until there is data).
- Alerts are sent once per patient when 3 or fewer are ahead, after each staff action. Pause stops alerts.
- Walk-ins added by staff can have no phone number.

## Folder map
    app/c/[slug]       patient join page
    app/t/[id]         patient live status page
    app/staff/[slug]   staff screen (PIN, queue, QR code)
    app/api/*          backend routes
    lib/queue.js       all queue logic
    lib/store-*.js     database (memory demo / MongoDB)
    lib/notify.js      WhatsApp/SMS alerts
