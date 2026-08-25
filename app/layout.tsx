import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Baloer — BAca LOkal Ebook Reader",
  description: "Aplikasi pembaca EPUB lokal. Tampilan nyaman, baca makin asyik, tanpa akun, privat, dan ringan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="minimalis"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code&family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,600;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Open+Sans:ital,wght@0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Roboto:ital,wght@0,400;0,500;1,400&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-[var(--font-jakarta)]">{children}</body>
    </html>
  );
}
