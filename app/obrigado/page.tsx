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
    <main className="relative min-h-dvh overflow-hidden bg-navy-deep px-5 py-16 safe-top safe-bottom sm:px-6 sm:py-24">
      <Sunburst className="pointer-events-none absolute -right-[30%] top-[6%] w-[90vw] max-w-[620px] opacity-[0.06] sm:-right-[15%] sm:w-[55vw]" />
      <div className="relative">
        <ObrigadoTicket />
      </div>
    </main>
  );
}
