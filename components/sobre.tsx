import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { ESPACO, INFO_PRINCIPAIS, SOBRE } from "@/lib/napraia-data";

export function Sobre() {
  return (
    <section id="evento" className="section bg-white">
      <div className="container-somma">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              <p className="eyebrow mb-4">{SOBRE.eyebrow}</p>
              <h2 className="section-title mb-6 max-w-[16ch]">{SOBRE.titulo}</h2>
              {SOBRE.paragrafos.map((p) => (
                <p
                  key={p}
                  className="mb-4 text-[16px] leading-7 text-muted sm:text-lg sm:leading-8"
                >
                  {p}
                </p>
              ))}
            </Reveal>

            <Reveal delay={0.1} className="mt-8">
              <div className="rounded-panel border border-primary/20 bg-primary-soft p-6 sm:p-7">
                <p className="text-[15px] font-medium leading-7 text-ink sm:text-[17px] sm:leading-8">
                  {SOBRE.resumo}
                </p>
              </div>
            </Reveal>
          </div>

          <div>
            <Reveal y={40} className="mb-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-panel">
                <Image
                  src={ESPACO.destaque.src}
                  alt={ESPACO.destaque.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>

            <Reveal delay={0.05} className="card overflow-hidden">
              <dl className="divide-y divide-black/[0.07]">
                {INFO_PRINCIPAIS.map((info) => (
                  <div
                    key={info.label}
                    className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6 sm:px-6"
                  >
                    <dt className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      {info.label}
                    </dt>
                    <dd className="text-[15px] font-medium leading-6 text-ink">
                      {info.valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
