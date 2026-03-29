import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redemption System — Real-Time Monitoring",
  description: "Multi-tenant redemption tracking and monitoring dashboard with real-time updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
