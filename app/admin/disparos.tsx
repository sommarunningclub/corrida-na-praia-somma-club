"use client";

import { useMemo, useState, useTransition } from "react";
import { verDisparo, type EstadoDisparo } from "@/app/admin/actions";
import { ROTULO_STATUS, type LeadAdmin } from "@/lib/admin-tipos";
import type { Papel } from "@/lib/admin-auth";
import {
  ABERTOS,
  CHEGARAM,
  Chip,
  Folha,
  GRUPO_ABERTOS,
  GRUPO_CHEGARAM,
  GRUPO_PROBLEMAS,
  PROBLEMAS,
  Selo,
  combinaStatus,
  dataHora,
  telefoneVisivel,
} from "@/app/admin/ui";

/** Como o recorte atual é anunciado acima da lista. */
const ROTULO_FILTRO: Record<string, string> = {
  [GRUPO_CHEGARAM]: "que chegaram ao destinatário",
  [GRUPO_ABERTOS]: "que foram abertos",
  [GRUPO_PROBLEMAS]: "que não chegaram",
  clicked: "com clique no e-mail",
};

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

/** Esconde a barra de rolagem do carrossel sem tirar o gesto de arrastar. */
const SEM_BARRA = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function Disparos({ leads, papel }: { leads: LeadAdmin[]; papel: Papel }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
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
    return comDisparo.filter((l) => {
      if (!combinaStatus(filtro, l.email_status)) return false;
      if (!t) return true;
      return [l.nome, l.email, l.resend_email_id].some((c) =>
        (c ?? "").toLowerCase().includes(t)
      );
    });
  }, [comDisparo, busca, filtro]);

  const taxas = [
    {
      rotulo: "Disparados",
      valor: comDisparo.length,
      parte: `${semDisparo} sem envio`,
      tom: "text-white",
      aoClicar: () => {
        setFiltro("todos");
        setBusca("");
      },
      ativo: filtro === "todos" && !busca,
    },
    {
      rotulo: "Entregues",
      valor: entregues,
      parte: pct(entregues, comDisparo.length),
      tom: "text-emerald-300",
      aoClicar: () => setFiltro(GRUPO_CHEGARAM),
      ativo: filtro === GRUPO_CHEGARAM,
    },
    {
      rotulo: "Abertos",
      valor: abertos,
      parte: `${pct(abertos, entregues)} dos entregues`,
      tom: "text-teal-300",
      aoClicar: () => setFiltro(GRUPO_ABERTOS),
      ativo: filtro === GRUPO_ABERTOS,
    },
    {
      rotulo: "Cliques",
      valor: cliques,
      parte: `${pct(cliques, abertos)} dos abertos`,
      tom: "text-cyan-300",
      aoClicar: () => setFiltro("clicked"),
      ativo: filtro === "clicked",
    },
    {
      rotulo: "Não chegaram",
      valor: falhas,
      parte: pct(falhas, comDisparo.length),
      tom: "text-red-300",
      aoClicar: () => setFiltro(GRUPO_PROBLEMAS),
      ativo: filtro === GRUPO_PROBLEMAS,
    },
  ];

  return (
    <>
      {/* Celular: cabeçalho e busca fixos, métricas em carrossel. */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-white/[0.06] bg-[#0b0b0f]/85 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
        <h1 className="text-[26px] font-bold leading-none tracking-tight">Disparos</h1>
        <p className="mt-1 truncate text-[12px] text-white/40">
          {comDisparo.length} e-mails enviados
          {papel === "leitor" && " · somente leitura"}
        </p>
        <div className="relative mt-2.5">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pessoa, e-mail ou ID do Resend"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-3 text-[16px] outline-none transition placeholder:text-white/30 focus:border-primary/50"
          />
        </div>
      </div>

      <div className={`-mx-4 mt-3 overflow-x-auto px-4 lg:hidden ${SEM_BARRA}`}>
        <div className="flex snap-x gap-2 pb-0.5">
          {taxas.map((t) => (
            <Chip
              key={t.rotulo}
              rotulo={t.rotulo}
              valor={t.valor}
              tom={t.tom}
              ativo={t.ativo}
              aoClicar={t.aoClicar}
            />
          ))}
        </div>
      </div>

      <div className="mb-5 hidden grid-cols-5 gap-3 lg:grid">
        {taxas.map((t) => (
          <button
            key={t.rotulo}
            type="button"
            onClick={t.aoClicar}
            className={`rounded-2xl border p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06] ${
              t.ativo ? "border-white/30 bg-white/[0.08]" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
              {t.rotulo}
            </p>
            <p className={`mt-1.5 text-[26px] font-bold leading-none tracking-tight ${t.tom}`}>
              {t.valor}
            </p>
            <p className="mt-1 text-[11px] font-medium text-white/30">{t.parte}</p>
          </button>
        ))}
      </div>

      {/* Distribuição por evento */}
      <div className="mb-5 mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:mt-0">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
          Onde cada disparo parou
        </p>
        <div className="space-y-2">
          {FUNIL.filter((e) => contagem.get(e)).map((evento) => {
            const n = contagem.get(evento) ?? 0;
            const largura = comDisparo.length ? (n / comDisparo.length) * 100 : 0;
            return (
              <button
                key={evento}
                type="button"
                onClick={() => setFiltro(evento)}
                className={`flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-left transition hover:bg-white/[0.05] ${
                  filtro === evento ? "bg-white/[0.08]" : ""
                }`}
              >
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
              </button>
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
        className="mb-3 hidden h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-[15px] outline-none transition placeholder:text-white/25 focus:border-primary/60 lg:block"
      />

      {/* Deixa explícito o recorte em que a lista está, com saída fácil. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-white/45">
          {filtro === "todos" ? (
            <>Mostrando os {visiveis.length} disparos</>
          ) : (
            <>
              <span className="font-semibold text-white/75">{visiveis.length}</span>{" "}
              {ROTULO_FILTRO[filtro] ?? "filtrados"}
            </>
          )}
        </p>
        {filtro !== "todos" && (
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className="shrink-0 rounded-full border border-white/12 px-3 py-1.5 text-[12px] font-semibold text-white/60 transition hover:border-white/25 hover:text-white"
          >
            Limpar filtro
          </button>
        )}
      </div>

      <ul className="overflow-hidden rounded-2xl border border-white/[0.08]">
        {visiveis.map((l, i) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => setAberto(l)}
              className={`flex w-full items-center gap-3 bg-white/[0.03] px-3.5 py-3 text-left transition active:bg-white/[0.09] hover:bg-white/[0.06] ${
                i > 0 ? "border-t border-white/[0.06]" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-tight">{l.nome}</p>
                <p className="mt-1 truncate text-[13px] text-white/40">{l.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Selo status={l.email_status} />
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/20" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
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
            : filtro === GRUPO_PROBLEMAS
              ? "Nenhum disparo falhou — todos chegaram."
              : "Nenhum disparo encontrado com esse recorte."}
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
