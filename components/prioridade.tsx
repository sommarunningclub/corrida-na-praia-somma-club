import { Reveal } from "@/components/ui/reveal";
import { PRIORIDADE } from "@/lib/napraia-data";

export function Prioridade() {
  return (
    <section id="prioridade" className="section bg-cream">
      <div className="container-somma">
        <Reveal className="mb-12 max-w-2xl">
          <p className="eyebrow mb-4">{PRIORIDADE.eyebrow}</p>
          <h2 className="section-title mb-5">{PRIORIDADE.titulo}</h2>
          <p className="text-[16px] leading-7 text-muted sm:text-lg sm:leading-8">
            {PRIORIDADE.descricao}
          </p>
        </Reveal>

        <Reveal className="grid gap-4 sm:grid-cols-2 sm:gap-5" stagger={0.12}>
          {PRIORIDADE.etapas.map((etapa) => (
            <div
              key={etapa.ordem}
              className={`rounded-panel border p-6 sm:p-8 ${
                etapa.destaque
                  ? "border-primary/30 bg-primary-soft"
                  : "border-black/[0.08] bg-white shadow-card"
              }`}
            >
              <span
                className={`mb-5 inline-grid h-11 w-11 place-items-center rounded-full text-[14px] font-bold tabular-nums ${
                  etapa.destaque
                    ? "bg-primary text-white"
                    : "border border-ink/10 bg-light text-ink"
                }`}
              >
                {etapa.ordem}
              </span>

              <h3 className="mb-2 text-[19px] font-semibold leading-snug sm:text-[21px]">
                {etapa.titulo}
              </h3>
              <p className="text-[15px] leading-6 text-muted">{etapa.descricao}</p>

              {etapa.destaque && (
                <span className="mt-5 inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  Você primeiro
                </span>
              )}
            </div>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <p className="rounded-card border border-black/[0.08] bg-white px-5 py-4 text-[14px] leading-6 text-muted">
            {PRIORIDADE.aviso}
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <a href="#inscricao" className="btn-primary w-full sm:w-auto">
            Entrar na lista VIP
            <span aria-hidden>→</span>
          </a>
          <p className="max-w-md text-[14px] leading-6 text-muted">
            {PRIORIDADE.chamadaNaoMembro}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
