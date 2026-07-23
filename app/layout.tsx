import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", base).toString();

  return {
    metadataBase: base,
    title: {
      default: "بلدية البيرة – عكار",
      template: "%s | بلدية البيرة – عكار",
    },
    description:
      "الموقع الرسمي لبلدية البيرة – عكار: أخبار، إعلانات، مشاريع، فعاليات ووثائق البلدية.",
    icons: {
      icon: "/municipality-source.jpg",
      shortcut: "/municipality-source.jpg",
    },
    openGraph: {
      title: "بلدية البيرة – عكار",
      description: "أخبار الضيعة وخدماتها، من مصدر رسمي واحد.",
      locale: "ar_LB",
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "بلدية البيرة – عكار",
      description: "أخبار الضيعة وخدماتها، من مصدر رسمي واحد.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
