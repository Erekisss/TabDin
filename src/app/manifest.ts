import type { MetadataRoute } from "next";

// Torna o TabDin instalável no celular ("Adicionar à Tela de Início").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TabDin — Finanças com Open Finance",
    short_name: "TabDin",
    description: "Suas contas, cartões e senhas em um só lugar, com o assistente Din.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#02060f",
    theme_color: "#02060f",
    lang: "pt-BR",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Perguntar ao Din", url: "/assistente", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Nova transação", url: "/transacoes", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
