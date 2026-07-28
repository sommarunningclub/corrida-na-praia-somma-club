"use client";

import { useEffect, useState } from "react";
import { EVENTO } from "@/lib/napraia-data";

/**
 * Barra de ação fixa no rodapé — padrão de app iOS.
 * Aparece depois do hero e some quando o formulário entra em cena,
 * para não competir com o próprio CTA da seção.
 */
export function CtaBar() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const form = document.getElementById("inscricao");

    const onScroll = () => {
      const passouHero = window.scrollY > window.innerHeight * 0.85;
      const formVisivel = form
        ? form.getBoundingClientRect().top < window.innerHeight * 0.9
        : false;
      setVisivel(passouHero && !formVisivel);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

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
