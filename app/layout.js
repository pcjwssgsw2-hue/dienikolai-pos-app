import './globals.css';

export const metadata = {
  title: 'dieNikolai POS App',
  description: 'Bestandsaufnahme App fuer dieNikolai POS-Regale',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'dieNikolai POS',
    statusBarStyle: 'default',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAF8F4',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
