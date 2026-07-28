"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { Reveal } from "@/components/ui/reveal";
import { AgendaEvento } from "@/components/agenda-evento";
import { CRONOGRAMA, CRONOGRAMA_NOTA, EVENTO } from "@/lib/napraia-data";

/** Linha do tempo do domingo. A trilha vertical se preenche conforme a
 *  seção passa pela viewport. Sem horários fixos: a organização ainda
 *  não confirmou abertura de portões e largada. */
export function Cronograma() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-trilha]",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-lista]",
            start: "top 75%",
            end: "bottom 75%",
            scrub: 0.5,
          },
        }
      );
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <section id="cronograma" ref={root} className="section bg-light">
      <div className="container-somma">
        <Reveal className="mb-12 max-w-2xl">
          <p className="eyebrow mb-4">O DIA DO EVENTO</p>
          <h2 className="section-title mb-5">Como vai ser o domingo</h2>
          <p className="text-[16px] leading-7 text-muted sm:text-lg sm:leading-8">
            Da chegada ao after. {EVENTO.dataExtenso}, no {EVENTO.local.nome}.
          </p>
        </Reveal>

        <div data-lista className="relative">
          {/* Trilha: fundo estático + preenchimento animado. */}
          <span
            aria-hidden
            className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px bg-ink/10 sm:left-[23px]"
          />
          <span
            data-trilha
            aria-hidden
            className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px origin-top bg-primary sm:left-[23px]"
          />

          <ol className="space-y-3">
            {CRONOGRAMA.map((item, i) => (
              <li key={item.titulo}>
                <Reveal className="flex items-start gap-4 sm:gap-6" y={20}>
                  {/* Marcador na trilha */}
                  <span
                    aria-hidden
                    className={`relative z-10 mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums sm:h-12 sm:w-12 sm:text-[15px] ${
                      item.destaque
                        ? "bg-primary text-white shadow-lift"
                        : "border border-ink/10 bg-white text-ink"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div
                    className={`flex-1 rounded-card border p-5 sm:p-6 ${
                      item.destaque
                        ? "border-primary/25 bg-primary-soft"
                        : "border-black/[0.07] bg-white shadow-card"
                    }`}
                  >
                    <h3 className="mb-1.5 text-[17px] font-semibold leading-snug sm:text-[19px]">
                      {item.titulo}
                    </h3>
                    <p className="text-[14px] leading-6 text-muted sm:text-[15px]">
                      {item.descricao}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        {/* Aviso honesto: os horários ainda não estão fechados. */}
        <Reveal delay={0.1} className="mt-8">
          <p className="rounded-card border border-black/[0.08] bg-white px-5 py-4 text-[14px] leading-6 text-muted">
            {CRONOGRAMA_NOTA}
          </p>
        </Reveal>

        {/* Logo depois da linha do tempo: é aqui que a pessoa está pensando
            em data e horário do domingo. */}
        <Reveal delay={0.1} className="mt-4">
          <AgendaEvento variante="claro" />
        </Reveal>

        <Reveal delay={0.15} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="#inscricao" className="btn-primary w-full sm:w-auto">
            Quero estar lá
            <span aria-hidden>→</span>
          </a>
          <p className="text-sm text-muted">
            O day use segue até às {EVENTO.dayUseAte}.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
