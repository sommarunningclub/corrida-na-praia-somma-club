"use client";

import { useState, useTransition } from "react";
import {
  cancelarOndaAcao,
  incluirNovosNaOnda,
  podarOndaAcao,
  sincronizarOnda,
  type EstadoAcao,
} from "@/app/admin/actions";
import type { ResumoOnda } from "@/lib/emails/disparo-store";
import type { Papel } from "@/lib/admin-auth";
import { dataHora } from "@/app/admin/ui";

/**
 * Acompanhamento das três ondas do Corre.
 *
 * A pergunta que essa tela responde é sempre a mesma, e quase sempre com o
 * disparo em cima da hora: já saiu, chegou em quanta gente, e quantos
 * clicaram. Por isso cada onda é um cartão fechado, com o funil em uma linha
 * e as ações logo abaixo.
 */
export function Campanha({ ondas, papel }: { ondas: ResumoOnda[]; papel: Papel }) {
  const soLeitura = papel === "leitor";
  const total = ondas.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 border-b border-white/[0.06] bg-[#0b0b0f]/85 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
        <h1 className="text-[26px] font-bold leading-none tracking-tight">Campanha</h1>
        <p className="mt-1 truncate text-[12px] text-white/40">
          Corre de 1º de agosto · {total} e-mails
          {soLeitura && " · somente leitura"}
        </p>
      </div>

      <div className="mb-4 mt-3 hidden lg:block">
        <p className="text-[13px] text-white/45">
          Três ondas para levar a lista VIP ao corre de sábado · {total} e-mails no total
        </p>
      </div>

      <div className="mt-3 space-y-3 lg:mt-0">
        {ondas.map((o) => (
          <CartaoOnda key={o.onda} onda={o} soLeitura={soLeitura} />
        ))}
      </div>

      {total === 0 && (
        <p className="rounded-2xl border border-white/10 px-4 py-10 text-center text-[14px] text-white/35">
          Nenhuma onda agendada ainda.
        </p>
      )}
    </>
  );
}

function CartaoOnda({ onda, soLeitura }: { onda: ResumoOnda; soLeitura: boolean }) {
  const [resposta, setResposta] = useState<EstadoAcao>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, iniciar] = useTransition();

  const jaSaiu = onda.agendados === 0 && onda.total > 0;
  const pct = (n: number, sobre: number) =>
    sobre ? `${Math.round((n / sobre) * 100)}%` : "—";

  // Enviados de verdade: o que não está agendado nem cancelado.
  const sairam = onda.total - onda.agendados - onda.cancelados;

  const funil = [
    { rotulo: "Agendados", valor: onda.agendados, tom: "text-amber-300" },
    { rotulo: "Entregues", valor: onda.entregues, tom: "text-emerald-300", parte: pct(onda.entregues, sairam) },
    { rotulo: "Abertos", valor: onda.abertos, tom: "text-teal-300", parte: pct(onda.abertos, onda.entregues) },
    { rotulo: "Cliques", valor: onda.cliques, tom: "text-cyan-300", parte: pct(onda.cliques, onda.abertos) },
  ];

  const rodar = (acao: () => Promise<EstadoAcao>) =>
    iniciar(async () => setResposta(await acao()));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            Onda {onda.onda} · {onda.papel}
          </p>
          <p className="mt-1 text-[17px] font-bold leading-tight">
            {dataHora(onda.agendadoPara)}
          </p>
          <p className="mt-0.5 text-[12px] text-white/40">
            {onda.total} e-mails
            {onda.cancelados > 0 && ` · ${onda.cancelados} cancelados`}
            {onda.problemas > 0 && ` · ${onda.problemas} não chegaram`}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            onda.total === 0
              ? "border-white/15 bg-white/[0.06] text-white/45"
              : jaSaiu
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/30 bg-amber-400/10 text-amber-300"
          }`}
        >
          {onda.total === 0 ? "Sem disparo" : jaSaiu ? "Enviada" : "Agendada"}
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-4 gap-2">
        {funil.map((f) => (
          <div key={f.rotulo} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">
              {f.rotulo}
            </p>
            <p className={`mt-1 text-[20px] font-bold leading-none tabular-nums ${f.tom}`}>
              {f.valor}
            </p>
            {f.parte && <p className="mt-0.5 text-[10px] text-white/30">{f.parte}</p>}
          </div>
        ))}
      </div>

      {!soLeitura && onda.total > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          <Acao
            rotulo="Atualizar status"
            ocupado={ocupado}
            aoClicar={() => rodar(() => sincronizarOnda(onda.onda))}
          />
          {onda.onda === 3 && !jaSaiu && (
            <Acao
              rotulo="Tirar quem já clicou"
              ocupado={ocupado}
              aoClicar={() => rodar(() => podarOndaAcao(onda.onda))}
            />
          )}
          {!jaSaiu && onda.agendadoPara && (
            <Acao
              rotulo="Incluir cadastros novos"
              ocupado={ocupado}
              aoClicar={() =>
                rodar(() => incluirNovosNaOnda(onda.onda, onda.agendadoPara as string))
              }
            />
          )}
          {!jaSaiu && !confirmando && (
            <Acao
              rotulo="Cancelar onda"
              perigo
              ocupado={ocupado}
              aoClicar={() => setConfirmando(true)}
            />
          )}
        </div>
      )}

      {/* A confirmação nasce em outro lugar da tela, não no botão que foi
          clicado: com os dois no mesmo ponto, um duplo clique cancela a onda
          inteira sem ninguém ter lido o aviso. */}
      {confirmando && (
        <div className="mt-3 rounded-xl border border-red-400/30 bg-red-400/[0.07] p-3">
          <p className="text-[13px] leading-relaxed text-red-200">
            Cancelar tira os {onda.agendados} e-mails da fila do Resend. Não dá para
            reagendar depois: para voltar atrás é preciso remontar a onda, e cada
            pessoa recebe um e-mail novo.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              disabled={ocupado}
              onClick={() => {
                setConfirmando(false);
                rodar(() => cancelarOndaAcao(onda.onda));
              }}
              className="min-h-[40px] rounded-full border border-red-400/40 px-3.5 text-[13px] font-semibold text-red-200 transition hover:bg-red-400/15 disabled:opacity-45"
            >
              Sim, cancelar os {onda.agendados}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="min-h-[40px] rounded-full border border-white/12 px-3.5 text-[13px] font-semibold text-white/70 transition hover:border-white/30"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {ocupado && (
        <p className="mt-2 text-[12px] text-white/40">
          Falando com o Resend, isso leva alguns minutos em onda grande…
        </p>
      )}

      {resposta && (
        <p
          role="status"
          className={`mt-2 text-[13px] font-medium ${
            resposta.ok ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {resposta.mensagem}
        </p>
      )}
    </div>
  );
}

function Acao({
  rotulo,
  aoClicar,
  ocupado,
  perigo,
}: {
  rotulo: string;
  aoClicar: () => void;
  ocupado: boolean;
  perigo?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={ocupado}
      onClick={aoClicar}
      className={`min-h-[40px] rounded-full border px-3.5 text-[13px] font-semibold transition disabled:opacity-45 ${
        perigo
          ? "border-red-400/30 text-red-300 hover:border-red-400/60 hover:bg-red-400/10"
          : "border-white/12 text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      {rotulo}
    </button>
  );
}
