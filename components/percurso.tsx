import { Reveal } from "@/components/ui/reveal";
import { Mapa } from "@/components/mapa";
import { EVENTO, PERCURSO } from "@/lib/napraia-data";

export function Percurso() {
  return (
    <section id="percurso" className="section bg-cream">
      <div className="container-somma">
        <Reveal className="mb-12 max-w-2xl">
          <p className="eyebrow mb-4">{PERCURSO.eyebrow}</p>
          <h2 className="section-title mb-5">{PERCURSO.titulo}</h2>
          {PERCURSO.paragrafos.map((p) => (
            <p
              key={p}
              className="mb-4 text-[16px] leading-7 text-muted sm:text-lg sm:leading-8"
            >
              {p}
            </p>
          ))}
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:gap-6">
          {/* Trajeto em etapas */}
          <Reveal className="order-2 lg:order-1" stagger={0.08}>
            {PERCURSO.trechos.map((t, i) => (
              <div key={t.ordem} className="flex gap-4 sm:gap-5">
                {/* Trilha vertical ligando as etapas */}
                <div className="flex flex-col items-center">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums sm:h-11 sm:w-11 sm:text-[13px] ${
                      i === 0 || i === PERCURSO.trechos.length - 1
                        ? "bg-primary text-white"
                        : "border border-ink/12 bg-white text-ink"
                    }`}
                  >
                    {t.ordem}
                  </span>
                  {i < PERCURSO.trechos.length - 1 && (
                    <span aria-hidden className="w-px flex-1 bg-ink/12" />
                  )}
                </div>

                <div className={i < PERCURSO.trechos.length - 1 ? "pb-6" : ""}>
                  <h3 className="mb-1 text-[16px] font-semibold leading-snug sm:text-[17px]">
                    {t.titulo}
                  </h3>
                  <p className="text-[14px] leading-6 text-muted">{t.descricao}</p>
                </div>
              </div>
            ))}
          </Reveal>

          {/* Mapa do parque */}
          <Reveal
            delay={0.1}
            className="order-1 min-h-[320px] overflow-hidden rounded-card sm:min-h-[420px] lg:order-2"
          >
            <Mapa />
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={EVENTO.local.maps}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark w-full sm:w-auto"
          >
            Como chegar
            <span aria-hidden>→</span>
          </a>
          <p className="text-sm text-muted">
            {EVENTO.local.endereco}, {EVENTO.local.bairro}.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
