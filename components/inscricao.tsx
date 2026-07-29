import { Reveal } from "@/components/ui/reveal";
import { AgendaEvento } from "@/components/agenda-evento";
import { ListaVipForm } from "@/components/lista-vip-form";
import { PrazoListaVip } from "@/components/prazo-lista-vip";
import { Sunburst } from "@/components/ui/sunburst";
import { listaVipFechada } from "@/lib/config-store";
import { EVENTO, LISTA_VIP, SORTEIO } from "@/lib/napraia-data";

// Resumo do que o ingresso contempla. A lista completa fica na seção #inclui;
// aqui é só o suficiente para a pessoa decidir entrar na lista.
const CONTEMPLA = [
  `Corrida de ${EVENTO.distancia} no ${EVENTO.local.nome}`,
  "Kit oficial com camiseta LIVE!, boné e meia",
  "Medalha de participação",
  "Café da manhã e smoothies",
  "Aulão de aquecimento com a Smart Fit",
  "Recovery e welcome drink no pós-prova",
  `Day use no parque até às ${EVENTO.dayUseAte}`,
  "After dentro do parque",
  "Uma cortesia para acompanhante",
  "Crianças até 10 anos não pagam",
];

export async function Inscricao() {
  // Chave do /admin. Vem de `unstable_cache` com tag, então a home continua
  // pré-renderizada e o toggle reflete assim que a ação invalida a tag.
  const fechada = await listaVipFechada();

  return (
    <section id="inscricao" className="section relative overflow-hidden bg-ink">
      <Sunburst className="pointer-events-none absolute -left-[22%] top-1/2 w-[80vw] max-w-[560px] -translate-y-1/2 opacity-[0.07] lg:-left-[12%] lg:w-[46vw]" />

      <div className="container-somma relative">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-4">{LISTA_VIP.eyebrow}</p>
            <h2 className="section-title mb-5 text-white">{LISTA_VIP.titulo}</h2>
            <p className="mb-8 text-[16px] leading-7 text-white/60 sm:text-lg sm:leading-8">
              {LISTA_VIP.descricao}
            </p>

            {/* Prazo de encerramento da lista */}
            <div className="mb-6">
              <PrazoListaVip />
            </div>

            {/* Escassez no lugar do preço */}
            <div className="mb-8 flex flex-wrap gap-3">
              <div className="flex-1 rounded-panel border border-primary/30 bg-primary/10 px-5 py-4">
                <p className="text-[22px] font-bold leading-none tracking-tight text-white sm:text-[26px]">
                  Vagas limitadas
                </p>
                <p className="mt-2 text-[13px] leading-5 text-white/50">
                  A corrida tem um número máximo de participantes
                </p>
              </div>
              <div className="flex-1 rounded-panel border border-white/12 bg-white/[0.04] px-5 py-4">
                <p className="text-[22px] font-bold leading-none tracking-tight text-white/80 sm:text-[26px]">
                  Em breve
                </p>
                <p className="mt-2 text-[13px] leading-5 text-white/40">
                  Valores e data de abertura das vendas
                </p>
              </div>
            </div>

            {/* O que o ingresso contempla */}
            <div className="mb-6 rounded-panel border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                O que o ingresso contempla
              </p>
              <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {CONTEMPLA.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-6 text-white/75"
                  >
                    <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#inclui"
                className="mt-4 inline-flex text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
              >
                Ver a lista completa →
              </a>
            </div>

            {/* Reforço do sorteio */}
            <div className="mb-6 rounded-panel border border-r2/30 bg-r2/10 p-5">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-r2">
                Concorra a um ingresso
              </p>
              <p className="text-[16px] font-semibold leading-snug text-white">
                {SORTEIO.atracoes}
              </p>
              <p className="mt-1 text-[13px] text-white/50">
                Show · {SORTEIO.showDia} · {SORTEIO.hora} · {SORTEIO.local}
              </p>
              <p className="mt-2 text-[13px] font-semibold text-r2">
                Sorteio · {SORTEIO.sorteioDia}
              </p>
            </div>

            {/* Guardar a data não depende da abertura das vendas: quem ainda
                está decidindo já sai daqui com o domingo bloqueado. */}
            <AgendaEvento variante="escuro" className="mb-6" />

            <p className="text-[12px] leading-5 text-white/35">{LISTA_VIP.aviso}</p>
          </Reveal>

          <Reveal delay={0.12} y={36}>
            <ListaVipForm fechada={fechada} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
