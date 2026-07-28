import { Reveal } from "@/components/ui/reveal";
import { ADICIONAIS, PREMIACAO } from "@/lib/napraia-data";

export function Extras() {
  return (
    <section id="extras" className="section bg-white">
      <div className="container-somma">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Premiação */}
          <Reveal>
            <p className="eyebrow mb-4">{PREMIACAO.eyebrow}</p>
            <h2 className="section-title mb-6">{PREMIACAO.titulo}</h2>

            <ul className="mb-5 space-y-3">
              {PREMIACAO.itens.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-card border border-black/[0.08] bg-light px-5 py-4"
                >
                  <span aria-hidden className="text-xl">
                    🏆
                  </span>
                  <span className="text-[15px] font-medium text-ink">{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-[13px] leading-6 text-muted">{PREMIACAO.nota}</p>
          </Reveal>

          {/* Experiências adicionais */}
          <Reveal delay={0.1}>
            <p className="eyebrow mb-4">{ADICIONAIS.eyebrow}</p>
            <h2 className="section-title mb-4">{ADICIONAIS.titulo}</h2>
            <p className="mb-6 text-[16px] leading-7 text-muted">{ADICIONAIS.descricao}</p>

            <div className="mb-5 space-y-3">
              {ADICIONAIS.itens.map((item) => (
                <div key={item.titulo} className="card p-5">
                  <h3 className="mb-1 text-[16px] font-semibold leading-snug">
                    {item.titulo}
                  </h3>
                  <p className="text-[14px] leading-6 text-muted">{item.descricao}</p>
                </div>
              ))}
            </div>

            <p className="text-[13px] leading-6 text-muted">{ADICIONAIS.nota}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
