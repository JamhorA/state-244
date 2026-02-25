import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const headingFont = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: {
    default: "State 244 Hub | 5-Star State of Survival Server",
    template: "%s | State 244 Hub"
  },
  description: "Join the undefeated 5-star State 244 in Last Z Survival Shooter. Elite alliances, 0 defeats in State vs State war, open recruitment. Apply for migration now!",
  keywords: [
    "Last Z Survival Shooter",
    "State of Survival",
    "State 244",
    "Server 244",
    "SvS 244",
    "5-Star Server",
    "Elite Alliance",
    "Game Alliance",
    "State vs State",
    "Undefeated Server",
    "Alliance Recruitment",
    "Migration Application",
    "Game Hub",
  ],
  authors: [{ name: "Jum", url: "https://state244.com" }],
  creator: "Jum from Hitsquad",
  creator: "State 244 Hub",
  metadataBase: new URL("https://state244.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://state244.com",
    title: "State 244 Hub | 5-Star State of Survival Server",
    description: "Join the undefeated 5-star State 244 in Last Z Survival Shooter. Elite alliances, 0 defeats in SvS. Apply for migration now!",
    siteName: "State 244 Hub",
    images: [
      {
        url: "https://state244.com/icon.svg",
        width: 1200,
        height: 630,
        alt: "State 244 Hub - 5-Star State of Survival Server",
      },
    ],
  },
  alternates: {
    canonical: "https://state244.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>{children}</body>
    </html>
  );
}
