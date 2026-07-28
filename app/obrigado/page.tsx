import type { Metadata } from "next";
import { ObrigadoTicket } from "@/components/obrigado-ticket";
import { Sunburst } from "@/components/ui/sunburst";

export const metadata: Metadata = {
  title: "Você está na lista VIP · Corrida na Praia",
  description: "Comprovante de cadastro na lista VIP da Corrida na Praia.",
  // Página de confirmação não deve aparecer em busca.
  robots: { index: false, follow: false },
};

export default function ObrigadoPage() {
  return (
    // pt maior que pb: no iOS a barra do Safari come o rodapé, e o safe-bottom
    // sozinho não dava respiro suficiente para o último botão.
    <main className="relative min-h-dvh overflow-hidden bg-navy-deep safe-top safe-bottom">
      <Sunburst className="pointer-events-none absolute -right-[38%] top-[4%] w-[95vw] max-w-[620px] opacity-[0.06] sm:-right-[15%] sm:w-[55vw]" />

      <div className="relative mx-auto w-full max-w-[560px] px-6 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:pt-20">
        <ObrigadoTicket />
      </div>
    </main>
  );
}
