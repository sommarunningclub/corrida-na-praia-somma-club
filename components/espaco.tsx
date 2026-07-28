"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { Reveal } from "@/components/ui/reveal";
import { ESPACO, EVENTO } from "@/lib/napraia-data";

const DETALHES = [
  { titulo: "Pé na areia", descricao: "Areia de verdade, à beira do Lago Paranoá." },
  { titulo: "Sombra garantida", descricao: "Tendas e palmeiras para descansar depois da corrida." },
  { titulo: "Estrutura pronta", descricao: "Bar, cozinha e banheiros no mesmo espaço da largada." },
];

/** Vitrine do espaço do Na Praia: foto de destaque com parallax leve
 *  e um carrossel com o resto das fotos. */
export function Espaco() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // A foto de destaque desliza um pouco mais devagar que a página.
      gsap.fromTo(
        "[data-destaque-img]",
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-destaque]",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <section id="espaco" ref={root} className="section overflow-hidden bg-navy-deep">
      <div className="container-somma">
        <Reveal className="mb-10 max-w-2xl">
          <p className="eyebrow mb-4">O ESPAÇO</p>
          <h2 className="section-title mb-5 text-white">
            É aqui que a corrida termina.
          </h2>
          <p className="text-[16px] leading-7 text-white/60 sm:text-lg sm:leading-8">
            O {EVENTO.local.nome} é praia de verdade no meio de Brasília. Você cruza a
            linha de chegada e já está dentro do festival: areia, sombra, música e o
            lago na frente.
          </p>
        </Reveal>

        {/* Foto de destaque */}
        <Reveal className="mb-4 sm:mb-5">
          <div data-destaque className="relative overflow-hidden rounded-panel">
            <div className="relative aspect-[4/3] sm:aspect-[16/9]">
              <div data-destaque-img className="absolute inset-[-8%]">
                <Image
                  src={ESPACO.destaque.src}
                  alt={ESPACO.destaque.alt}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy-deep/85 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
              <p className="text-[15px] font-medium leading-6 text-white sm:text-lg">
                {EVENTO.local.nome} · {EVENTO.local.bairro}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Carrossel do espaço — snap no mobile, arrasta no desktop. */}
        <Reveal
          className="scroll-snap-x -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:gap-4 sm:px-6 lg:mx-0 lg:px-0"
          stagger={0.05}
        >
          {ESPACO.fotos.map((foto) => (
            <div
              key={foto.src}
              className="snap-item relative aspect-[3/4] w-[62vw] shrink-0 overflow-hidden rounded-card bg-white/5 sm:w-[38vw] lg:w-[24%] lg:min-w-0"
            >
              <Image
                src={foto.src}
                alt={foto.alt}
                fill
                sizes="(max-width: 640px) 62vw, (max-width: 1024px) 38vw, 290px"
                className="object-cover"
              />
            </div>
          ))}
        </Reveal>

        {/* Detalhes do espaço */}
        <Reveal className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-8" stagger={0.1}>
          {DETALHES.map((d) => (
            <div key={d.titulo}>
              <h3 className="mb-1.5 text-[17px] font-semibold leading-snug text-white">
                {d.titulo}
              </h3>
              <p className="text-[14px] leading-6 text-white/50">{d.descricao}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
