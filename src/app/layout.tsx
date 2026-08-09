import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal RW 09 Kebon Bawang",
  description: "Sistem Informasi Komunitas RW 09 Kebon Bawang, Jakarta Utara",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Load Material Symbols with display=block to prevent raw text (FOUT) glitch during hot reload */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f9f9f9] text-[#1a1c1c] min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
