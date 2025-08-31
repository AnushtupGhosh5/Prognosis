import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Prognosis - Medical Simulation Training",
  description: "Interactive AI-powered medical case simulations for medical students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className={`${inter.className} antialiased`}>
        {/* Initialize theme before paint to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('theme');
                var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (_) { document.documentElement.setAttribute('data-theme','dark'); }
            `,
          }}
        />
        <div className="min-h-screen bg-bg">
          {children}
        </div>
      </body>
    </html>
  );
}
