import './globals.css';

export const metadata = { title: 'NoWait', description: 'Wait anywhere. We will call you.' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0C2B2E" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
