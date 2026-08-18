import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GradConnect", template: "%s | GradConnect" },
  description: "A career acceleration platform for IT graduates.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
