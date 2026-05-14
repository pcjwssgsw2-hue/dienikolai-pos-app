export const metadata = {
  title: "dieNikolai POS App",
  description: "Bestandsaufnahme App"
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
