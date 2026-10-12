import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wobble Café — Coffee, snacks & things that wobble",
  description:
    "A little café in Brooklyn, New York, serving coffee, snacks and wonderfully wobbly things.",
  openGraph: {
    title: "Wobble Café",
    description: "Coffee, snacks & things that wobble.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
