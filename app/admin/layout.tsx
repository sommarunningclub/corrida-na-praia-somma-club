import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel · Lista VIP Corrida na Praia",
  // Painel interno com dados pessoais: fora do índice e sem preview em link.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#0b0b0f] text-white">{children}</div>;
}
