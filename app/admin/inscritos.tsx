"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adicionarLead,
  alternarFormulario,
  removerLead,
  sair,
  salvarLead,
  sincronizarEmails,
  type EstadoAcao,
} from "@/app/admin/actions";
import {
  ORIGEM_MEMBRO,
  ORIGEM_NOVO,
  ORIGEM_ROTULO,
  ROTULO_STATUS,
  type LeadAdmin,
} from "@/lib/admin-tipos";
import type { Papel } from "@/lib/admin-auth";
import {
  ActionSheet,
  CHEGARAM,
  Campo,
  Chip,
  Folha,
  GRUPO_CHEGARAM,
  GRUPO_PROBLEMAS,
  PROBLEMAS,
  Selo,
  combinaStatus,
  dataHora,
  telefoneVisivel,
  type Acao,
} from "@/app/admin/ui";

function baixarCsv(leads: LeadAdmin[]) {
  const cabecalho = [
    "nome", "email", "telefone", "cpf", "origem", "status_email",
    "email_enviado_em", "utm_source", "utm_medium", "utm_campaign", "cadastro_em",
  ];
  const escapar = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const linhas = leads.map((l) =>
    [
      l.nome, l.email, telefoneVisivel(l.telefone), l.cpf,
      ORIGEM_ROTULO[l.origem] ?? l.origem,
      ROTULO_STATUS[l.email_status ?? "nao_enviado"] ?? l.email_status,
      dataHora(l.email_sent_at), l.utm_source, l.utm_medium, l.utm_campaign,
      dataHora(l.created_at),
    ].map(escapar).join(";")
  );

  // BOM para o Excel em pt-BR abrir os acentos corretamente.
  const blob = new Blob(["﻿" + [cabecalho.join(";"), ...linhas].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lista-vip-napraia-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Esconde a barra de rolagem do carrossel sem tirar o gesto de arrastar. */
const SEM_BARRA = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function Inscritos({
  leads,
  fechada,
  papel,
}: {
  leads: LeadAdmin[];
  fechada: boolean;
  papel: Papel;
}) {
  const podeEditar = papel === "editor";

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroOrigem, setFiltroOrigem] = useState("todos");
  const [aberto, setAberto] = useState<LeadAdmin | null>(null);
  const [editando, setEditando] = useState(false);
  const [novo, setNovo] = useState(false);
  const [menu, setMenu] = useState(false);
  const [aviso, setAviso] = useState<EstadoAcao>(null);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return leads.filter((l) => {
      if (!combinaStatus(filtroStatus, l.email_status)) return false;
      if (filtroOrigem !== "todos" && l.origem !== filtroOrigem) return false;
      if (!termo) return true;
      return [l.nome, l.email, l.telefone, l.cpf].some((c) =>
        (c ?? "").toLowerCase().includes(termo)
      );
    });
  }, [leads, busca, filtroStatus, filtroOrigem]);

  const porStatus = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const l of leads) {
      const k = l.email_status ?? "nao_enviado";
      mapa.set(k, (mapa.get(k) ?? 0) + 1);
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // Os números seguem o que está na tela: filtrou por origem, tudo recalcula.
  const filtrando = filtroOrigem !== "todos" || filtroStatus !== "todos" || !!busca.trim();
  const base = visiveis;
  const jaMembros = base.filter((l) => l.origem === ORIGEM_MEMBRO).length;
  const novosMembros = base.filter((l) => l.origem === ORIGEM_NOVO).length;
  const entregues = base.filter((l) => CHEGARAM.includes(l.email_status ?? "")).length;
  const problemas = base.filter((l) => PROBLEMAS.includes(l.email_status ?? "")).length;
  const fatia = (n: number) =>
    base.length ? `${Math.round((n / base.length) * 100)}%` : "";

  const limpar = () => {
    setFiltroOrigem("todos");
    setFiltroStatus("todos");
    setBusca("");
  };

  const atualizar = () => iniciar(() => router.refresh());

  const sincronizar = () => iniciar(async () => setAviso(await sincronizarEmails()));

  const alternar = () => {
    const proxima = !fechada;
    if (
      !confirm(
        proxima
          ? "Fechar o formulário? O site deixa de aceitar novos cadastros na hora."
          : "Reabrir o formulário? O site volta a aceitar cadastros."
      )
    )
      return;
    iniciar(async () => setAviso(await alternarFormulario(proxima)));
  };

  /** As mesmas ações servem o action sheet do celular e a barra do desktop. */
  const acoes: Acao[] = podeEditar
    ? [
        { rotulo: "Novo inscrito", aoClicar: () => setNovo(true), tom: "destaque" },
        {
          rotulo: pendente ? "Consultando o Resend…" : "Atualizar status de entrega",
          aoClicar: sincronizar,
          desativado: pendente,
        },
        { rotulo: `Baixar CSV (${visiveis.length})`, aoClicar: () => baixarCsv(visiveis) },
        {
          rotulo: fechada ? "Reabrir formulário da lista VIP" : "Fechar formulário da lista VIP",
          aoClicar: alternar,
          tom: fechada ? "normal" : "perigo",
          desativado: pendente,
        },
      ]
    : [];

  // "Sair" mora no menu do celular — inclusive para o leitor, que não tem
  // nenhuma outra ação e ficaria sem como encerrar a sessão.
  const acoesMobile: Acao[] = [
    ...acoes,
    { rotulo: "Sair do painel", aoClicar: () => iniciar(() => sair()), tom: "perigo" },
  ];

  const filtros = [
    {
      rotulo: filtrando ? "Filtrados" : "Todos",
      valor: base.length,
      tom: "text-white",
      aoClicar: limpar,
      ativo: !filtrando,
    },
    {
      rotulo: "Já eram membros",
      valor: jaMembros,
      tom: "text-sky-300",
      aoClicar: () => setFiltroOrigem(ORIGEM_MEMBRO),
      ativo: filtroOrigem === ORIGEM_MEMBRO,
    },
    {
      rotulo: "Novos membros",
      valor: novosMembros,
      tom: "text-violet-300",
      aoClicar: () => setFiltroOrigem(ORIGEM_NOVO),
      ativo: filtroOrigem === ORIGEM_NOVO,
    },
    {
      rotulo: "Entregues",
      valor: entregues,
      tom: "text-emerald-300",
      aoClicar: () => setFiltroStatus(GRUPO_CHEGARAM),
      ativo: filtroStatus === GRUPO_CHEGARAM,
    },
    {
      rotulo: "Não chegaram",
      valor: problemas,
      tom: "text-red-300",
      aoClicar: () => setFiltroStatus(GRUPO_PROBLEMAS),
      ativo: filtroStatus === GRUPO_PROBLEMAS,
    },
  ];

  return (
    <>
      {/* ═══════════════ CELULAR ═══════════════
          Cabeçalho e busca grudam no topo; a lista é o que ocupa a tela. */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-30 -mx-4 border-b border-white/[0.06] bg-[#0b0b0f]/85 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[26px] font-bold leading-none tracking-tight">Lista VIP</h1>
              <p className="mt-1 truncate text-[12px] text-white/40">
                {filtrando ? `${visiveis.length} de ${leads.length}` : `${leads.length} inscritos`}
                {" · "}
                <span className={fechada ? "text-amber-300" : "text-emerald-300"}>
                  {fechada ? "formulário fechado" : "formulário aberto"}
                </span>
                {papel === "leitor" && " · somente leitura"}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={atualizar}
                disabled={pendente}
                aria-label="Atualizar"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] transition active:scale-90 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] ${pendente ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {podeEditar && (
                <button
                  type="button"
                  onClick={() => setNovo(true)}
                  aria-label="Novo inscrito"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary transition active:scale-90"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={() => setMenu(true)}
                aria-label="Mais ações"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] transition active:scale-90"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nome, e-mail, telefone ou CPF"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-9 text-[16px] outline-none transition placeholder:text-white/30 focus:border-primary/50"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/60"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Métricas viram carrossel: informam sem empurrar a lista para baixo. */}
        <div className={`-mx-4 mt-3 overflow-x-auto px-4 ${SEM_BARRA}`}>
          <div className="flex snap-x gap-2 pb-0.5">
            {filtros.map((f) => (
              <Chip key={f.rotulo} {...f} />
            ))}
          </div>
        </div>

        {aviso && (
          <p
            className={`mt-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium ${
              aviso.ok
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-red-500/10 text-red-300"
            }`}
          >
            {aviso.mensagem}
          </p>
        )}

        <ul className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08]">
          {visiveis.map((l, i) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setAberto(l)}
                className={`flex w-full items-center gap-3 bg-white/[0.03] px-3.5 py-3 text-left transition active:bg-white/[0.09] ${
                  i > 0 ? "border-t border-white/[0.06]" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold leading-tight">{l.nome}</p>
                  <p className="mt-1 truncate text-[13px] text-white/40">{l.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Selo status={l.email_status} />
                    <span className="truncate text-[11px] text-white/30">
                      {ORIGEM_ROTULO[l.origem] ?? l.origem}
                    </span>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white/20" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
                  <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ═══════════════ DESKTOP ═══════════════ */}
      <div className="hidden lg:block">
        <div className="mb-5 grid grid-cols-6 gap-3">
          {[
            ...filtros.map((f) => ({
              ...f,
              parte: f.rotulo === "Todos" || f.rotulo === "Filtrados"
                ? filtrando ? `de ${leads.length}` : undefined
                : fatia(f.valor),
            })),
            {
              rotulo: "Formulário",
              valor: fechada ? "Fechado" : "Aberto",
              tom: fechada ? "text-amber-300" : "text-emerald-300",
              aoClicar: undefined,
              ativo: false,
              parte: undefined,
            },
          ].map((c) => {
            const Tag = c.aoClicar ? "button" : "div";
            return (
              <Tag
                key={c.rotulo}
                {...(c.aoClicar ? { type: "button" as const, onClick: c.aoClicar } : {})}
                className={`rounded-2xl border p-4 text-left transition ${
                  c.ativo ? "border-white/30 bg-white/[0.08]" : "border-white/10 bg-white/[0.03]"
                } ${c.aoClicar ? "hover:border-white/25 hover:bg-white/[0.06]" : ""}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                  {c.rotulo}
                </p>
                <p className={`mt-1.5 text-[26px] font-bold leading-none tracking-tight ${c.tom}`}>
                  {c.valor}
                </p>
                {c.parte && <p className="mt-1 text-[11px] font-medium text-white/30">{c.parte}</p>}
              </Tag>
            );
          })}
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pendente}
              onClick={atualizar}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] font-semibold transition hover:bg-white/16 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className={`h-4 w-4 ${pendente ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Atualizar
            </button>

            {acoes.map((a) => (
              <button
                key={a.rotulo}
                type="button"
                disabled={a.desativado}
                onClick={a.aoClicar}
                className={`min-h-[42px] rounded-full px-4 text-[13px] font-semibold transition disabled:opacity-50 ${
                  a.tom === "destaque"
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : a.tom === "perigo"
                      ? "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                      : "bg-white/10 hover:bg-white/16"
                }`}
              >
                {a.rotulo}
              </button>
            ))}
          </div>

          {aviso && (
            <p className={`mt-3 text-[13px] font-medium ${aviso.ok ? "text-emerald-300" : "text-red-300"}`}>
              {aviso.mensagem}
            </p>
          )}

          <p className="mt-3 text-[12px] leading-5 text-white/35">
            {podeEditar
              ? `A sincronização pergunta ao Resend o último evento de cada e-mail enviado. O Resend limita a 2 consultas por segundo, então a lista inteira leva cerca de ${Math.max(1, Math.round((leads.length * 0.46) / 5) * 5)} segundos hoje — deixe a aba aberta até terminar.`
              : "Seu acesso é somente leitura: dá para consultar e filtrar, não para alterar ou exportar."}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou CPF"
            className="h-12 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/30 px-4 text-[15px] outline-none transition placeholder:text-white/25 focus:border-primary/60"
          />
          <select
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value)}
            className="h-12 rounded-xl border border-white/12 bg-black/30 px-3 text-[14px] outline-none focus:border-primary/60"
          >
            <option value="todos">Todas as origens</option>
            {[...new Set(leads.map((l) => l.origem))].map((o) => (
              <option key={o} value={o}>
                {ORIGEM_ROTULO[o] ?? o}
              </option>
            ))}
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-12 rounded-xl border border-white/12 bg-black/30 px-3 text-[14px] outline-none focus:border-primary/60"
          >
            <option value="todos">Todos os status</option>
            <option value={GRUPO_CHEGARAM}>
              Chegaram ({leads.filter((l) => CHEGARAM.includes(l.email_status ?? "")).length})
            </option>
            <option value={GRUPO_PROBLEMAS}>
              Não chegaram ({leads.filter((l) => PROBLEMAS.includes(l.email_status ?? "")).length})
            </option>
            {porStatus.map(([s, n]) => (
              <option key={s} value={s}>
                {ROTULO_STATUS[s] ?? s} ({n})
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-white/[0.04] text-[11px] uppercase tracking-[0.1em] text-white/40">
                {["Pessoa", "Contato", "CPF", "Origem", "E-mail", "Cadastro"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setAberto(l)}
                  className="cursor-pointer border-t border-white/[0.07] align-top text-[13px] transition hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{l.nome}</p>
                    {(l.utm_source || l.utm_campaign) && (
                      <p className="mt-0.5 text-[11px] text-white/35">
                        {[l.utm_source, l.utm_medium, l.utm_campaign].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/80">{l.email}</p>
                    <p className="mt-0.5 text-white/45">{telefoneVisivel(l.telefone)}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-white/60">{l.cpf}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-white/60">
                    {ORIGEM_ROTULO[l.origem] ?? l.origem}
                  </td>
                  <td className="px-4 py-3">
                    <Selo status={l.email_status} />
                    <p className="mt-1 whitespace-nowrap text-[11px] text-white/35">
                      {dataHora(l.email_sent_at)}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-white/50">
                    {dataHora(l.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {visiveis.length === 0 && (
        <p className="mt-3 rounded-2xl border border-white/10 px-4 py-10 text-center text-[14px] text-white/35">
          {leads.length === 0
            ? "Nenhum cadastro na lista VIP ainda."
            : "Nenhum cadastro encontrado com esses filtros."}
        </p>
      )}

      {menu && (
        <ActionSheet titulo="Lista VIP" acoes={acoesMobile} aoFechar={() => setMenu(false)} />
      )}

      {aberto && (
        <FichaLead
          lead={aberto}
          podeEditar={podeEditar}
          editando={editando}
          setEditando={setEditando}
          aoFechar={() => {
            setAberto(null);
            setEditando(false);
          }}
          aoExcluir={() => {
            setAberto(null);
            setEditando(false);
          }}
        />
      )}

      {novo && <NovoLead aoFechar={() => setNovo(false)} />}
    </>
  );
}

/* ─── Ficha da pessoa ─────────────────────────────────────────────────────── */

function FichaLead({
  lead,
  podeEditar,
  editando,
  setEditando,
  aoFechar,
  aoExcluir,
}: {
  lead: LeadAdmin;
  podeEditar: boolean;
  editando: boolean;
  setEditando: (v: boolean) => void;
  aoFechar: () => void;
  aoExcluir: () => void;
}) {
  const [erro, setErro] = useState("");
  const [salvando, iniciar] = useTransition();

  const linhas: Array<[string, string]> = [
    ["E-mail", lead.email],
    ["Telefone", telefoneVisivel(lead.telefone)],
    ["CPF", lead.cpf],
    ["Origem", ORIGEM_ROTULO[lead.origem] ?? lead.origem],
    ["Status do e-mail", ROTULO_STATUS[lead.email_status ?? "nao_enviado"] ?? "—"],
    ["E-mail enviado em", dataHora(lead.email_sent_at)],
    ["Entrou na lista em", dataHora(lead.created_at)],
    ["Campanha", [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" · ") || "—"],
    ["ID do disparo", lead.resend_email_id ?? "—"],
  ];

  return (
    <Folha
      titulo={lead.nome}
      subtitulo={`Entrou em ${dataHora(lead.created_at)}`}
      aoFechar={aoFechar}
    >
      {editando ? (
        <form
          action={(fd) =>
            iniciar(async () => {
              const r = await salvarLead(null, fd);
              if (r?.ok) aoFechar();
              else setErro(r?.mensagem ?? "Não foi possível salvar.");
            })
          }
        >
          <input type="hidden" name="id" value={lead.id} />
          <Campo name="nome" rotulo="Nome completo" valor={lead.nome} autoFocus />
          <Campo name="email" rotulo="E-mail" valor={lead.email} tipo="email" modo="email" />
          <Campo name="telefone" rotulo="Telefone" valor={lead.telefone} modo="tel" />
          <Campo name="cpf" rotulo="CPF" valor={lead.cpf} modo="numeric" />

          {erro && (
            <p role="alert" className="mb-3 text-[13px] font-medium text-red-300">
              {erro}
            </p>
          )}

          <div className="mt-5 flex gap-2.5">
            <button
              type="submit"
              disabled={salvando}
              className="btn-primary min-h-[48px] flex-1 justify-center disabled:opacity-60"
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditando(false);
                setErro("");
              }}
              className="min-h-[48px] rounded-full border border-white/12 px-5 text-[14px] font-semibold text-white/60 transition hover:border-white/25 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          <dl className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
            {linhas.map(([rotulo, valor]) => (
              <div key={rotulo} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-[12px] font-medium text-white/40">{rotulo}</dt>
                <dd className="min-w-0 break-words text-right text-[14px] text-white/85">
                  {valor}
                </dd>
              </div>
            ))}
          </dl>

          {podeEditar ? (
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="btn-primary min-h-[48px] flex-1 justify-center"
              >
                Editar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={() => {
                  if (!confirm(`Excluir o cadastro de ${lead.nome}? Não dá para desfazer.`)) return;
                  iniciar(async () => {
                    const r = await removerLead(lead.id);
                    if (r?.ok) aoExcluir();
                    else setErro(r?.mensagem ?? "Não foi possível excluir.");
                  });
                }}
                className="min-h-[48px] rounded-full border border-red-500/30 bg-red-500/10 px-5 text-[14px] font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
              >
                {salvando ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[12px] leading-5 text-white/40">
              Acesso somente leitura.
            </p>
          )}

          {erro && (
            <p role="alert" className="mt-3 text-[13px] font-medium text-red-300">
              {erro}
            </p>
          )}
        </>
      )}
    </Folha>
  );
}

/* ─── Novo inscrito ───────────────────────────────────────────────────────── */

function NovoLead({ aoFechar }: { aoFechar: () => void }) {
  const [erro, setErro] = useState("");
  const [salvando, iniciar] = useTransition();

  return (
    <Folha
      titulo="Novo inscrito"
      subtitulo="Entra na lista VIP como cadastro manual, sem e-mail automático"
      aoFechar={aoFechar}
    >
      <form
        action={(fd) =>
          iniciar(async () => {
            const r = await adicionarLead(null, fd);
            if (r?.ok) aoFechar();
            else setErro(r?.mensagem ?? "Não foi possível cadastrar.");
          })
        }
      >
        <Campo name="nome" rotulo="Nome completo" autoFocus />
        <Campo name="email" rotulo="E-mail" tipo="email" modo="email" />
        <Campo name="telefone" rotulo="Telefone com DDD" modo="tel" />
        <Campo name="cpf" rotulo="CPF" modo="numeric" />

        {erro && (
          <p role="alert" className="mb-3 text-[13px] font-medium text-red-300">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="btn-primary mt-2 min-h-[48px] w-full justify-center disabled:opacity-60"
        >
          {salvando ? "Cadastrando…" : "Adicionar à lista VIP"}
        </button>
      </form>
    </Folha>
  );
}
