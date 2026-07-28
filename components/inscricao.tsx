import { Reveal } from "@/components/ui/reveal";
import { ListaVipForm } from "@/components/lista-vip-form";
import { Sunburst } from "@/components/ui/sunburst";
import { PRECOS, SORTEIO } from "@/lib/napraia-data";

const VANTAGENS = [
  "Acesso antecipado à pré-venda",
  "Link enviado por WhatsApp e e-mail",
  "Concorre a um ingresso para o show",
];

export function Inscricao() {
  return (
    <section id="inscricao" className="section relative overflow-hidden bg-ink">
      <Sunburst className="pointer-events-none absolute -left-[22%] top-1/2 w-[80vw] max-w-[560px] -translate-y-1/2 opacity-[0.07] lg:-left-[12%] lg:w-[46vw]" />

      <div className="container-somma relative">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-4">{PRECOS.eyebrow}</p>
            <h2 className="section-title mb-5 text-white">{PRECOS.titulo}</h2>
            <p className="mb-8 text-[16px] leading-7 text-white/60 sm:text-lg sm:leading-8">
              {PRECOS.descricao}
            </p>

            {/* Preços */}
            <div className="mb-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-panel border border-primary/30 bg-primary/10 p-5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Pré-venda lista VIP
                </p>
                <p className="text-[30px] font-bold leading-none tracking-tight text-white">
                  {PRECOS.preVenda}
                </p>
                <p className="mt-2 text-[13px] leading-5 text-white/50">
                  {PRECOS.preVendaDuracao}
                </p>
              </div>
              <div className="rounded-panel border border-white/12 bg-white/[0.04] p-5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  Venda geral
                </p>
                <p className="text-[13px] leading-none text-white/45">a partir de</p>
                <p className="mt-1 text-[30px] font-bold leading-none tracking-tight text-white/70">
                  R$ 180,00
                </p>
                <p className="mt-2 text-[13px] leading-5 text-white/40">
                  Depois da pré-venda
                </p>
              </div>
            </div>

            <ul className="mb-6 space-y-3.5">
              {VANTAGENS.map((v) => (
                <li
                  key={v}
                  className="flex items-start gap-3 text-[15px] leading-6 text-white/75"
                >
                  <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-primary">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3 w-3"
                      fill="none"
                      stroke="#fff"
                      strokeWidth={3.5}
                      aria-hidden
                    >
                      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {v}
                </li>
              ))}
            </ul>

            {/* Reforço do sorteio */}
            <div className="mb-6 rounded-panel border border-r2/30 bg-r2/10 p-5">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-r2">
                Concorra a um ingresso
              </p>
              <p className="text-[16px] font-semibold leading-snug text-white">
                {SORTEIO.atracoes}
              </p>
              <p className="mt-1 text-[13px] text-white/50">
                {SORTEIO.data} · {SORTEIO.hora} · {SORTEIO.local}
              </p>
            </div>

            <p className="text-[12px] leading-5 text-white/35">{PRECOS.aviso}</p>
          </Reveal>

          <Reveal delay={0.12} y={36}>
            <ListaVipForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
