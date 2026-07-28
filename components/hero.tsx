"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { EVENTO, STATS } from "@/lib/napraia-data";
import { Countdown } from "@/components/countdown";
import { Sunburst } from "@/components/ui/sunburst";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set("[data-hero]", { opacity: 1, y: 0, filter: "none", scale: 1 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        "[data-hero='vip']",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.65 }
      )
        .fromTo(
          "[data-hero='eyebrow']",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.35"
        )
        .fromTo(
          "[data-hero='word']",
          { opacity: 0, y: 44, filter: "blur(10px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, stagger: 0.08 },
          "-=0.3"
        )
        .fromTo(
          "[data-hero='sub']",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.75 },
          "-=0.55"
        )
        .fromTo(
          "[data-hero='count']",
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.75 },
          "-=0.5"
        )
        .fromTo(
          "[data-hero='cta']",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.1 },
          "-=0.45"
        )
        .fromTo(
          "[data-hero='stat']",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.07 },
          "-=0.4"
        );

      // As ondas do fundo derivam devagar conforme a página rola.
      gsap.to("[data-hero='onda']", {
        yPercent: -14,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-hero='content']", {
        opacity: 0,
        y: -32,
        ease: "none",
        scrollTrigger: { trigger: el, start: "45% top", end: "bottom top", scrub: true },
      });
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="topo"
      ref={root}
      className="relative flex min-h-viewport items-end overflow-hidden bg-navy"
    >
      {/* Profundidade: brilho quente no alto, azul mais fundo embaixo. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_75%_5%,rgba(252,173,0,0.16)_0%,rgba(1,7,117,0)_55%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy-deep to-transparent"
      />

      {/* Ondas: a "praia" do Na Praia sem usar foto. */}
      <svg
        data-hero="onda"
        aria-hidden
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38vh] w-full opacity-[0.18]"
      >
        <path
          d="M0 180 C 240 120, 480 240, 720 180 S 1200 120, 1440 190 L1440 320 L0 320 Z"
          fill="#FEF5E6"
          opacity="0.35"
        />
        <path
          d="M0 230 C 260 180, 520 280, 780 230 S 1220 180, 1440 240 L1440 320 L0 320 Z"
          fill="#FEF5E6"
          opacity="0.25"
        />
        <path
          d="M0 275 C 280 240, 560 310, 840 272 S 1240 235, 1440 285 L1440 320 L0 320 Z"
          fill="#FCAD00"
          opacity="0.22"
        />
      </svg>

      {/* Selo do Na Praia girando */}
      <Sunburst className="pointer-events-none absolute right-[-16%] top-[10%] w-[66vw] max-w-[440px] opacity-[0.14] sm:right-[-6%] sm:w-[44vw] lg:right-[3%] lg:w-[32vw] lg:opacity-[0.18]" />

      <div
        data-hero="content"
        className="container-somma relative z-10 pb-14 pt-28 safe-bottom sm:pb-20 lg:pb-24"
      >
        {/* CTA de topo: leva direto pra lista VIP antes mesmo do título. */}
        <a
          data-hero="vip"
          href="#inscricao"
          className="gsap-hidden group mb-7 inline-flex min-h-[44px] items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] py-2 pl-2 pr-4 backdrop-blur-md transition-colors duration-200 hover:border-white/30 active:scale-[0.98] sm:mb-8"
        >
          <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
            Lista VIP aberta
          </span>
          <span className="text-[13px] font-medium text-white/85 sm:text-sm">
            Acesso antecipado à pré-venda
          </span>
          <span
            aria-hidden
            className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5"
          >
            →
          </span>
        </a>

        <p
          data-hero="eyebrow"
          className="gsap-hidden mb-4 text-[12px] font-medium uppercase tracking-[0.22em] text-r2 sm:text-sm"
        >
          {EVENTO.nome} · {EVENTO.dia}.09.{EVENTO.ano} · {EVENTO.diaSemana}
        </p>

        {/* Chamada da collab */}
        <h1 className="mb-6 text-white">
          <span className="sr-only">{EVENTO.chamada}</span>
          <span
            aria-hidden
            className="block text-[clamp(2.1rem,8.4vw,5.5rem)] font-bold leading-[0.98] tracking-wordmark"
          >
            <span data-hero="word" className="gsap-hidden block">
              Somma Club <span className="text-white/35">&amp;</span> R2
            </span>
            <span data-hero="word" className="gsap-hidden block text-white/70">
              te levam pro
            </span>
            <span data-hero="word" className="gsap-hidden block text-primary">
              Na Praia Festival
              {/* Ponto final da marca: colado na palavra, como no wordmark "somma." */}
              <span className="brand-dot ml-[0.04em] inline-block h-[0.11em] w-[0.11em] rounded-[2px] align-baseline" />
            </span>
          </span>
        </h1>

        <p
          data-hero="sub"
          className="gsap-hidden mb-7 max-w-xl text-[15px] leading-6 text-white/65 sm:mb-9 sm:text-lg sm:leading-8"
        >
          {EVENTO.dataExtenso}. Corrida de {EVENTO.distancia} com largada e chegada
          dentro do {EVENTO.local.nome}, kit oficial, medalha e day use até as{" "}
          {EVENTO.dayUseAte}.
        </p>

        <div data-hero="count" className="gsap-hidden mb-7 max-w-lg sm:mb-9">
          <Countdown />
        </div>

        <div className="mb-9 flex flex-col gap-3 sm:mb-14 sm:flex-row sm:items-center">
          <a data-hero="cta" href="#inscricao" className="gsap-hidden btn-primary w-full sm:w-auto">
            Entrar na lista VIP
            <span aria-hidden>→</span>
          </a>
          <a data-hero="cta" href="#cronograma" className="gsap-hidden btn-ghost-dark w-full sm:w-auto">
            Ver o cronograma
          </a>
        </div>

        <dl className="grid grid-cols-4 gap-x-3 gap-y-6 border-t border-white/12 pt-6 sm:gap-x-4 sm:pt-8">
          {STATS.map((s) => (
            <div data-hero="stat" key={s.label} className="gsap-hidden">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block text-[17px] font-semibold leading-none tracking-tight text-white sm:text-[26px]">
                  {s.value}
                </span>
                <span className="mt-1.5 block text-[9px] uppercase leading-tight tracking-[0.1em] text-white/45 sm:text-xs sm:tracking-[0.14em]">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
