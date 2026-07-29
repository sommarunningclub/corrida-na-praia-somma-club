"use client";

import { EVENTO } from "@/lib/napraia-data";
import { useMenuAberto, useMostrarFlutuante } from "@/lib/flutuantes";

/**
 * Barra de ação fixa no rodapé — padrão de app iOS.
 * A regra de quando aparecer mora em lib/flutuantes, compartilhada com o
 * botão de agenda, que no mobile fica logo acima desta barra.
 */
export function CtaBar() {
  const mostrar = useMostrarFlutuante();
  const menuAberto = useMenuAberto();
  const visivel = mostrar && !menuAberto;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 safe-bottom transition-transform duration-300 ease-out lg:hidden ${
        visivel ? "translate-y-0" : "translate-y-[130%]"
      }`}
      aria-hidden={!visivel}
    >
      <div className="glass-dark m-3 flex items-center gap-3 rounded-full border border-white/10 p-2 pl-5 shadow-lift">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-white">
            {EVENTO.dataCurta} · {EVENTO.distancia}
          </p>
          <p className="truncate text-[11px] leading-tight text-white/50">
            Vagas limitadas · entre na lista VIP
          </p>
        </div>
        <a
          href="#inscricao"
          tabIndex={visivel ? 0 : -1}
          className="btn-primary h-11 min-h-0 shrink-0 px-5 text-[14px]"
        >
          Quero ir
        </a>
      </div>
    </div>
  );
}
