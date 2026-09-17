import "./globals.css";

export const metadata = {
  title: "Dossier — wie van jullie heeft het gedaan?",
  description:
    "Een sociaal deductiespel waarin de dader méér weet dan jij. Reconstrueer de moord — en vertrouw niemand.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Public+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="storm" aria-hidden="true">
          <div className="rain" />
          <div className="lightning" />
        </div>
        {children}
      </body>
    </html>
  );
}
