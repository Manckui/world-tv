import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.scss";

const archivo = localFont({
  src: [
    { path: "../../public/fonts/archivo-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/archivo-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/archivo-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/archivo-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "World TV — Un altro punto di vista",
  description: "Esplora l’Italia sulla mappa e scopri le TV nazionali e del territorio. Un Paese alla volta.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={archivo.variable}>
      {/* Extensions such as ColorZilla add attributes to body before hydration. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
