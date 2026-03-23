import type { Metadata } from "next";
import { Lora, Noto_Serif_TC } from "next/font/google";
// Hidden during beta — re-enable when Japanese/Korean languages are turned on:
// import { Shippori_Mincho, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["300", "400"],
});

// const shipporiMincho = Shippori_Mincho({
//   variable: "--font-shippori",
//   subsets: ["latin"],
//   weight: ["400", "500"],
// });
//
// const notoSerifKR = Noto_Serif_KR({
//   variable: "--font-noto-serif-kr",
//   subsets: ["latin"],
//   weight: ["300", "400"],
// });

export const metadata: Metadata = {
  title: "Breathe",
  description: "A mindful breathing space",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lora.variable} ${notoSerifTC.variable} antialiased`}>{children}</body>
    </html>
  );
}
