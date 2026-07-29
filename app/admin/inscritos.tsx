"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adicionarLead,
  alternarFormulario,
  removerLead,
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
  CHEGARAM,
  Campo,
  Folha,
  PROBLEMAS,
  Selo,
  dataHora,
  telefoneVisivel,
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
  const [aviso, setAviso] = useState<EstadoAcao>(null);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return leads.filter((l) => {
      if (filtroStatus !== "todos" && (l.email_status ?? "nao_enviado") !== filtroStatus)
        return false;
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

  const cartoes = [
    {
      rotulo: filtrando ? "Filtrados" : "Cadastros",
      valor: base.length,
      parte: filtrando ? `de ${leads.length}` : undefined,
      tom: "text-white",
      aoClicar: limpar,
      ativo: !filtrando,
    },
    {
      rotulo: "Já eram membros",
      valor: jaMembros,
      parte: fatia(jaMembros),
      tom: "text-sky-300",
      aoClicar: () => setFiltroOrigem(ORIGEM_MEMBRO),
      ativo: filtroOrigem === ORIGEM_MEMBRO,
    },
    {
      rotulo: "Novos membros",
      valor: novosMembros,
      parte: fatia(novosMembros),
      tom: "text-violet-300",
      aoClicar: () => setFiltroOrigem(ORIGEM_NOVO),
      ativo: filtroOrigem === ORIGEM_NOVO,
    },
    {
      rotulo: "E-mails entregues",
      valor: entregues,
      parte: fatia(entregues),
      tom: "text-emerald-300",
    },
    { rotulo: "Não chegaram", valor: problemas, tom: "text-red-300" },
    {
      rotulo: "Formulário",
      valor: fechada ? "Fechado" : "Aberto",
      tom: fechada ? "text-amber-300" : "text-emerald-300",
    },
  ];

  return (
    <>
      {/* Números */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
        {cartoes.map((c) => {
          const Tag = c.aoClicar ? "button" : "div";
          return (
            <Tag
              key={c.rotulo}
              {...(c.aoClicar ? { type: "button" as const, onClick: c.aoClicar } : {})}
              className={`rounded-2xl border p-3.5 text-left transition lg:p-4 ${
                c.ativo ? "border-white/30 bg-white/[0.08]" : "border-white/10 bg-white/[0.03]"
              } ${c.aoClicar ? "active:scale-[0.98] hover:border-white/25 hover:bg-white/[0.06]" : ""}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 lg:text-[11px]">
                {c.rotulo}
              </p>
              <p className={`mt-1.5 text-[22px] font-bold leading-none tracking-tight lg:text-[26px] ${c.tom}`}>
                {c.valor}
              </p>
              {c.parte && <p className="mt-1 text-[11px] font-medium text-white/30">{c.parte}</p>}
            </Tag>
          );
        })}
      </div>

      {/* Ações */}
      <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 lg:p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pendente}
            onClick={() => iniciar(() => router.refresh())}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] font-semibold transition active:scale-[0.97] hover:bg-white/16 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Atualizar
          </button>

          {podeEditar && (
            <>
              <button
                type="button"
                onClick={() => setNovo(true)}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white transition active:scale-[0.97] hover:bg-primary-hover"
              >
                <span aria-hidden className="text-[17px] leading-none">+</span>
                Novo inscrito
              </button>

              <button
                type="button"
                disabled={pendente}
                onClick={() => iniciar(async () => setAviso(await sincronizarEmails()))}
                className="min-h-[42px] rounded-full bg-white/10 px-4 text-[13px] font-semibold transition active:scale-[0.97] hover:bg-white/16 disabled:opacity-50"
              >
                {pendente ? "Consultando o Resend…" : "Atualizar status de entrega"}
              </button>

              <button
                type="button"
                disabled={pendente}
                onClick={() => {
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
                }}
                className={`min-h-[42px] rounded-full px-4 text-[13px] font-semibold transition active:scale-[0.97] disabled:opacity-50 ${
                  fechada
                    ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                    : "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                }`}
              >
                {fechada ? "Reabrir formulário" : "Fechar formulário"}
              </button>

              <button
                type="button"
                onClick={() => baixarCsv(visiveis)}
                className="min-h-[42px] rounded-full border border-white/12 px-4 text-[13px] font-semibold text-white/70 transition active:scale-[0.97] hover:border-white/25 hover:text-white"
              >
                Baixar CSV ({visiveis.length})
              </button>
            </>
          )}
        </div>

        {aviso && (
          <p className={`mt-3 text-[13px] font-medium ${aviso.ok ? "text-emerald-300" : "text-red-300"}`}>
            {aviso.mensagem}
          </p>
        )}

        {podeEditar ? (
          <p className="mt-3 text-[12px] leading-5 text-white/35">
            A sincronização pergunta ao Resend o último evento de cada e-mail enviado.
            O Resend limita a 2 consultas por segundo, então a lista inteira leva cerca
            de {Math.max(1, Math.round((leads.length * 0.46) / 5) * 5)} segundos hoje —
            deixe a aba aberta até terminar.
          </p>
        ) : (
          <p className="mt-3 text-[12px] leading-5 text-white/35">
            Seu acesso é somente leitura: dá para consultar e filtrar, não para alterar
            ou exportar.
          </p>
        )}
      </div>

      {/* Busca e filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail, telefone ou CPF"
          className="h-12 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/30 px-4 text-[16px] outline-none transition placeholder:text-white/25 focus:border-primary/60"
        />
        <div className="flex w-full gap-2 sm:w-auto">
          <select
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value)}
            className="h-12 flex-1 rounded-xl border border-white/12 bg-black/30 px-3 text-[16px] outline-none focus:border-primary/60 sm:flex-none sm:text-[14px]"
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
            className="h-12 flex-1 rounded-xl border border-white/12 bg-black/30 px-3 text-[16px] outline-none focus:border-primary/60 sm:flex-none sm:text-[14px]"
          >
            <option value="todos">Todos os status</option>
            {porStatus.map(([s, n]) => (
              <option key={s} value={s}>
                {ROTULO_STATUS[s] ?? s} ({n})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile: cartões tocáveis. Tabela em telas grandes. */}
      <ul className="space-y-2 lg:hidden">
        {visiveis.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => setAberto(l)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition active:scale-[0.99] active:bg-white/[0.07]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{l.nome}</p>
                <p className="mt-0.5 truncate text-[13px] text-white/45">{l.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Selo status={l.email_status} />
                  <span className="rounded-full border border-white/12 px-2 py-1 text-[11px] text-white/45">
                    {ORIGEM_ROTULO[l.origem] ?? l.origem}
                  </span>
                </div>
              </div>
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-white/25" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 lg:block">
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

      {visiveis.length === 0 && (
        <p className="rounded-2xl border border-white/10 px-4 py-10 text-center text-[14px] text-white/35">
          {leads.length === 0
            ? "Nenhum cadastro na lista VIP ainda."
            : "Nenhum cadastro encontrado com esses filtros."}
        </p>
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
