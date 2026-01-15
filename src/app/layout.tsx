import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Node Service",
  description: "Next.js Node Service Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
