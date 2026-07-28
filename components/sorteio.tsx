import { Reveal } from "@/components/ui/reveal";
import { SORTEIO } from "@/lib/napraia-data";

/** Faixa de destaque da ação promocional da lista VIP.
 *  Fica logo abaixo do hero, no amarelo da R2, para não passar batido. */
export function Sorteio() {
  return (
    <section id="sorteio" className="relative overflow-hidden bg-r2 py-12 sm:py-16">
      <div className="container-somma">
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-deep/70 sm:text-[13px]">
              {SORTEIO.eyebrow}
            </p>
            <h2 className="mb-4 text-[26px] font-bold leading-[1.1] tracking-display text-navy-deep sm:text-[34px] lg:text-[40px]">
              {SORTEIO.titulo}
            </h2>

            <p className="mb-2 text-[19px] font-bold leading-tight text-navy-deep sm:text-[24px]">
              {SORTEIO.atracoes}
            </p>
            <p className="text-[15px] font-medium text-navy-deep/70 sm:text-base">
              {SORTEIO.data} · {SORTEIO.hora} · {SORTEIO.local}
            </p>

            <p className="mt-5 max-w-md text-[12px] leading-5 text-navy-deep/55">
              {SORTEIO.regra}
            </p>
          </div>

          <a
            href="#inscricao"
            className="btn inline-flex w-full shrink-0 bg-navy-deep text-white hover:bg-navy sm:w-auto"
          >
            Quero concorrer
            <span aria-hidden>→</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
