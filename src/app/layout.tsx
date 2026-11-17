import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "TabDin — Finanças com Open Finance", template: "%s · TabDin" },
  description:
    "Gestão financeira pessoal com Open Finance, dashboards e cofre de senhas criptografado.",
  appleWebApp: { capable: true, title: "TabDin", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#030814",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="aurora" aria-hidden>
          <span className="aurora-blob aurora-a" />
          <span className="aurora-blob aurora-b" />
          <span className="aurora-blob aurora-c" />
        </div>
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
