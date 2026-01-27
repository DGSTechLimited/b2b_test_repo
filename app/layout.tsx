import type { Metadata } from "next";
import { Karla, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800", "900"]
});
const karla = Karla({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Dealer Portal",
  description: "B2B parts ordering portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${karla.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
