"use client";

import { useMemo, useState, useTransition } from "react";
import { verDisparo, type EstadoDisparo } from "@/app/admin/actions";
import { ROTULO_STATUS, type LeadAdmin } from "@/lib/admin-tipos";
import { CHEGARAM, Folha, PROBLEMAS, Selo, dataHora, telefoneVisivel } from "@/app/admin/ui";

/** Ordem de leitura do funil, do disparo ao clique. */
const FUNIL = [
  "sent",
  "delivered",
  "opened",
  "clicked",
  "delivery_delayed",
  "bounced",
  "complained",
  "suppressed",
  "failed",
  "canceled",
];

export function Disparos({ leads }: { leads: LeadAdmin[] }) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<LeadAdmin | null>(null);

  const comDisparo = useMemo(() => leads.filter((l) => l.resend_email_id), [leads]);
  const semDisparo = leads.length - comDisparo.length;

  const contagem = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const l of comDisparo) {
      const k = l.email_status ?? "nao_enviado";
      mapa.set(k, (mapa.get(k) ?? 0) + 1);
    }
    return mapa;
  }, [comDisparo]);

  const entregues = comDisparo.filter((l) => CHEGARAM.includes(l.email_status ?? "")).length;
  const abertos = comDisparo.filter((l) =>
    ["opened", "clicked"].includes(l.email_status ?? "")
  ).length;
  const cliques = contagem.get("clicked") ?? 0;
  const falhas = comDisparo.filter((l) => PROBLEMAS.includes(l.email_status ?? "")).length;

  const pct = (n: number, sobre: number) =>
    sobre ? `${Math.round((n / sobre) * 100)}%` : "—";

  const visiveis = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return comDisparo;
    return comDisparo.filter((l) =>
      [l.nome, l.email, l.resend_email_id].some((c) => (c ?? "").toLowerCase().includes(t))
    );
  }, [comDisparo, busca]);

  const taxas = [
    { rotulo: "Disparados", valor: comDisparo.length, parte: `${semDisparo} sem envio`, tom: "text-white" },
    { rotulo: "Entregues", valor: entregues, parte: pct(entregues, comDisparo.length), tom: "text-emerald-300" },
    { rotulo: "Abertos", valor: abertos, parte: `${pct(abertos, entregues)} dos entregues`, tom: "text-teal-300" },
    { rotulo: "Cliques", valor: cliques, parte: `${pct(cliques, abertos)} dos abertos`, tom: "text-cyan-300" },
    { rotulo: "Não chegaram", valor: falhas, parte: pct(falhas, comDisparo.length), tom: "text-red-300" },
  ];

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
        {taxas.map((t) => (
          <div key={t.rotulo} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 lg:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 lg:text-[11px]">
              {t.rotulo}
            </p>
            <p className={`mt-1.5 text-[22px] font-bold leading-none tracking-tight lg:text-[26px] ${t.tom}`}>
              {t.valor}
            </p>
            <p className="mt-1 text-[11px] font-medium text-white/30">{t.parte}</p>
          </div>
        ))}
      </div>

      {/* Distribuição por evento */}
      <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
          Onde cada disparo parou
        </p>
        <div className="space-y-2">
          {FUNIL.filter((e) => contagem.get(e)).map((evento) => {
            const n = contagem.get(evento) ?? 0;
            const largura = comDisparo.length ? (n / comDisparo.length) * 100 : 0;
            return (
              <div key={evento} className="flex items-center gap-3">
                <span className="w-[92px] shrink-0 text-[12px] text-white/55">
                  {ROTULO_STATUS[evento] ?? evento}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full ${
                      PROBLEMAS.includes(evento) ? "bg-red-400/60" : "bg-emerald-400/60"
                    }`}
                    style={{ width: `${Math.max(largura, 1.5)}%` }}
                  />
                </div>
                <span className="w-[68px] shrink-0 text-right text-[12px] tabular-nums text-white/45">
                  {n} · {pct(n, comDisparo.length)}
                </span>
              </div>
            );
          })}
          {contagem.size === 0 && (
            <p className="py-4 text-center text-[13px] text-white/35">
              Nenhum disparo registrado ainda.
            </p>
          )}
        </div>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar disparo por pessoa, e-mail ou ID do Resend"
        className="mb-4 h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-[16px] outline-none transition placeholder:text-white/25 focus:border-primary/60"
      />

      <ul className="space-y-2">
        {visiveis.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => setAberto(l)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition active:scale-[0.99] hover:bg-white/[0.06]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{l.nome}</p>
                <p className="mt-0.5 truncate text-[13px] text-white/45">{l.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Selo status={l.email_status} />
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/25" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {visiveis.length === 0 && (
        <p className="rounded-2xl border border-white/10 px-4 py-10 text-center text-[14px] text-white/35">
          {comDisparo.length === 0
            ? "Nenhum e-mail foi disparado ainda."
            : "Nenhum disparo encontrado com essa busca."}
        </p>
      )}

      {aberto && <FichaDisparo lead={aberto} aoFechar={() => setAberto(null)} />}
    </>
  );
}

/* ─── Consulta individual ─────────────────────────────────────────────────── */

function FichaDisparo({ lead, aoFechar }: { lead: LeadAdmin; aoFechar: () => void }) {
  const [resposta, setResposta] = useState<EstadoDisparo>(null);
  const [consultando, iniciar] = useTransition();

  const local: Array<[string, string]> = [
    ["Para", lead.email],
    ["Telefone", telefoneVisivel(lead.telefone)],
    ["Status salvo", ROTULO_STATUS[lead.email_status ?? "nao_enviado"] ?? "—"],
    ["Enviado em", dataHora(lead.email_sent_at)],
    ["ID do disparo", lead.resend_email_id ?? "—"],
  ];

  return (
    <Folha titulo={lead.nome} subtitulo="Disparo do e-mail da lista VIP" aoFechar={aoFechar}>
      <dl className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
        {local.map(([r, v]) => (
          <div key={r} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="shrink-0 text-[12px] font-medium text-white/40">{r}</dt>
            <dd className="min-w-0 break-all text-right text-[14px] text-white/85">{v}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        disabled={consultando || !lead.resend_email_id}
        onClick={() =>
          iniciar(async () => setResposta(await verDisparo(lead.resend_email_id as string)))
        }
        className="mt-4 min-h-[48px] w-full rounded-full bg-white/10 text-[14px] font-semibold transition hover:bg-white/16 disabled:opacity-50"
      >
        {consultando ? "Consultando o Resend…" : "Consultar no Resend agora"}
      </button>

      {resposta && !resposta.ok && (
        <p role="alert" className="mt-3 text-[13px] font-medium text-red-300">
          {resposta.mensagem}
        </p>
      )}

      {resposta?.ok && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
            Direto do Resend
          </p>
          <dl className="space-y-2">
            {(
              [
                ["Último evento", ROTULO_STATUS[resposta.detalhe.ultimoEvento] ?? resposta.detalhe.ultimoEvento],
                ["Assunto", resposta.detalhe.assunto ?? "—"],
                ["Remetente", resposta.detalhe.de ?? "—"],
                ["Destinatário", resposta.detalhe.para],
                ["Disparado em", dataHora(resposta.detalhe.criadoEm)],
              ] as Array<[string, string]>
            ).map(([r, v]) => (
              <div key={r} className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-[12px] text-white/40">{r}</dt>
                <dd className="min-w-0 break-words text-right text-[13px] text-white/85">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Folha>
  );
}
