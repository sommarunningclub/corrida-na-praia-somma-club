import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Painel · Lista VIP Corrida na Praia",
  // Painel interno com dados pessoais: fora do índice e sem preview em link.
  robots: { index: false, follow: false, nocache: true },
  appleWebApp: { capable: true, title: "Lista VIP", statusBarStyle: "black-translucent" },
};

/**
 * Só nesta rota o zoom fica travado, para o painel se comportar como app no
 * celular. Vale porque é ferramenta interna e todo texto/alvo já é grande o
 * bastante — no site público o zoom continua liberado, como deve ser.
 */
export const viewport: Viewport = {
  themeColor: "#0b0b0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0b0b0f] text-white [-webkit-tap-highlight-color:transparent]">
      {children}
    </div>
  );
}
