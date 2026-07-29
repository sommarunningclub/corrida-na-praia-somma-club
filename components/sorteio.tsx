import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { SORTEIO } from "@/lib/napraia-data";

/** Faixa de destaque da ação promocional da lista VIP.
 *  Fica logo abaixo do hero, no amarelo da R2, para não passar batido. */
export function Sorteio() {
  return (
    <section id="sorteio" className="relative overflow-hidden bg-r2 py-12 sm:py-16">
      <div className="container-somma">
        <Reveal className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-deep/70 sm:text-[13px]">
              {SORTEIO.eyebrow}
            </p>
            <h2 className="mb-5 text-[26px] font-bold leading-[1.1] tracking-display text-navy-deep sm:text-[34px] lg:text-[40px]">
              {SORTEIO.titulo}
            </h2>

            <p className="mb-6 text-[19px] font-bold leading-tight text-navy-deep sm:text-[24px]">
              {SORTEIO.atracoes}
            </p>

            {/* Sorteio na sexta, entrega presencial no sábado de manhã, show à noite.
                A ordem importa: é o que responde "e como eu recebo o ingresso?". */}
            <ol className="relative mb-6 space-y-2.5">
              <span
                aria-hidden
                className="absolute left-[15px] top-3 h-[calc(100%-24px)] w-px bg-navy-deep/15"
              />
              {SORTEIO.etapas.map((etapa, i) => (
                <li key={etapa.titulo} className="flex items-start gap-3 sm:gap-4">
                  <span
                    aria-hidden
                    className={`relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums ${
                      etapa.destaque
                        ? "bg-navy-deep text-r2 shadow-lift"
                        : "border border-navy-deep/20 bg-r2 text-navy-deep"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div
                    className={`min-w-0 flex-1 rounded-2xl px-4 py-3 ${
                      etapa.destaque
                        ? "bg-navy-deep text-white shadow-lift"
                        : "border border-navy-deep/12 bg-white/55 text-navy-deep"
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        etapa.destaque ? "text-r2" : "text-navy-deep/55"
                      }`}
                    >
                      {etapa.selo}
                    </p>
                    <h3 className="mt-1 text-[15px] font-bold leading-snug sm:text-[16px]">
                      {etapa.titulo}
                    </h3>
                    <p
                      className={`mt-1 text-[13px] leading-5 sm:text-[14px] ${
                        etapa.destaque ? "text-white/75" : "text-navy-deep/65"
                      }`}
                    >
                      {etapa.descricao}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* A condição que muda o comportamento de quem participa: tem que aparecer. */}
            <div className="mb-6 rounded-2xl border border-navy-deep/15 border-l-4 border-l-navy-deep bg-white/70 px-4 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-deep/55">
                Importante
              </p>
              <p className="mt-1 text-[13px] font-medium leading-5 text-navy-deep sm:text-[14px]">
                {SORTEIO.avisoPresenca}
              </p>
            </div>

            <p className="mb-7 max-w-md text-[12px] leading-5 text-navy-deep/55">
              {SORTEIO.regra}
            </p>

            <a
              href="#inscricao"
              className="btn inline-flex w-full shrink-0 bg-navy-deep text-white hover:bg-navy sm:w-auto"
            >
              Quero concorrer
              <span aria-hidden>→</span>
            </a>
          </div>

          {/* Poster do show: card clicável → página do ingresso na R2 */}
          <a
            href={SORTEIO.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver o show ${SORTEIO.atracoes} no site da R2`}
            className="group relative mx-auto block w-full max-w-[280px] shrink-0 justify-self-center overflow-hidden rounded-panel bg-navy-deep shadow-lift transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-16px_rgba(1,5,63,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-deep sm:max-w-[300px] lg:mx-0 lg:justify-self-end lg:max-w-none"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={SORTEIO.poster}
                alt={`Cartaz do show ${SORTEIO.atracoes} — 1º de agosto no Na Praia Festival`}
                fill
                sizes="(max-width: 1024px) 280px, 320px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                priority
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-transparent to-transparent opacity-90"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-r2">
                    Show · Sáb 01 ago
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-white">
                    Ver no site da R2
                  </p>
                </div>
                <span
                  aria-hidden
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy-deep transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </div>
            </div>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
