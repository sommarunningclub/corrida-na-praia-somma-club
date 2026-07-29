"use client";

import { useMemo, useState, useTransition } from "react";
import {
  alternarFormulario,
  sair,
  salvarLead,
  sincronizarEmails,
  type EstadoAcao,
} from "@/app/admin/actions";
import { ORIGEM_ROTULO, ROTULO_STATUS, type LeadAdmin } from "@/lib/admin-tipos";

/* ─── Aparência dos status ────────────────────────────────────────────────── */

const CORES: Record<string, string> = {
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  opened: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  clicked: "bg-emerald-500/20 text-emerald-200 border-emerald-500/35",
  sent: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  queued: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  scheduled: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  delivery_delayed: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  bounced: "bg-red-500/15 text-red-300 border-red-500/25",
  complained: "bg-red-500/15 text-red-300 border-red-500/25",
  suppressed: "bg-red-500/15 text-red-300 border-red-500/25",
  failed: "bg-red-500/15 text-red-300 border-red-500/25",
  canceled: "bg-white/8 text-white/50 border-white/15",
};

/** Não chegaram: contam como problema no resumo e no filtro. */
const PROBLEMAS = ["bounced", "complained", "suppressed", "failed"];
const CHEGARAM = ["delivered", "opened", "clicked"];

function Selo({ status }: { status: string | null }) {
  const chave = status ?? "nao_enviado";
  const cor = CORES[chave] ?? "bg-white/8 text-white/45 border-white/15";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cor}`}
    >
      {ROTULO_STATUS[chave] ?? chave}
    </span>
  );
}

/* ─── Formatação ──────────────────────────────────────────────────────────── */

function dataHora(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function telefoneVisivel(t: string): string {
  const d = t.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t || "—";
}

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

/* ─── Painel ──────────────────────────────────────────────────────────────── */

export function Painel({
  leads,
  fechada,
  erroCarga,
}: {
  leads: LeadAdmin[];
  fechada: boolean;
  erroCarga: string;
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroOrigem, setFiltroOrigem] = useState("todos");
  const [editando, setEditando] = useState<LeadAdmin | null>(null);
  const [aviso, setAviso] = useState<EstadoAcao>(null);
  const [pendente, iniciar] = useTransition();

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

  const entregues = leads.filter((l) => CHEGARAM.includes(l.email_status ?? "")).length;
  const problemas = leads.filter((l) => PROBLEMAS.includes(l.email_status ?? "")).length;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Corrida na Praia · 06.09.2026
          </p>
          <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
            Lista VIP
          </h1>
        </div>
        <form action={sair}>
          <button className="rounded-full border border-white/12 px-4 py-2 text-[13px] font-semibold text-white/60 transition hover:border-white/25 hover:text-white">
            Sair
          </button>
        </form>
      </header>

      {erroCarga && (
        <p className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-200">
          {erroCarga}
        </p>
      )}

      {/* Números */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { rotulo: "Cadastros", valor: leads.length, tom: "text-white" },
          { rotulo: "E-mails entregues", valor: entregues, tom: "text-emerald-300" },
          { rotulo: "Não chegaram", valor: problemas, tom: "text-red-300" },
          {
            rotulo: "Formulário",
            valor: fechada ? "Fechado" : "Aberto",
            tom: fechada ? "text-amber-300" : "text-emerald-300",
          },
        ].map((c) => (
          <div key={c.rotulo} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
              {c.rotulo}
            </p>
            <p className={`mt-1.5 text-[26px] font-bold leading-none tracking-tight ${c.tom}`}>
              {c.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={pendente}
            onClick={() =>
              iniciar(async () => setAviso(await sincronizarEmails()))
            }
            className="rounded-full bg-white/10 px-4 py-2 text-[13px] font-semibold transition hover:bg-white/16 disabled:opacity-50"
          >
            {pendente ? "Consultando o Resend…" : "Atualizar status de entrega"}
          </button>

          <button
            type="button"
            disabled={pendente}
            onClick={() => {
              const proxima = !fechada;
              const texto = proxima
                ? "Fechar o formulário? O site deixa de aceitar novos cadastros na hora."
                : "Reabrir o formulário? O site volta a aceitar cadastros.";
              if (!confirm(texto)) return;
              iniciar(async () => setAviso(await alternarFormulario(proxima)));
            }}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${
              fechada
                ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                : "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
            }`}
          >
            {fechada ? "Reabrir formulário da lista VIP" : "Fechar formulário da lista VIP"}
          </button>

          <button
            type="button"
            onClick={() => baixarCsv(visiveis)}
            className="rounded-full border border-white/12 px-4 py-2 text-[13px] font-semibold text-white/70 transition hover:border-white/25 hover:text-white"
          >
            Baixar CSV ({visiveis.length})
          </button>
        </div>

        {aviso && (
          <p
            className={`mt-3 text-[13px] font-medium ${
              aviso.ok ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {aviso.mensagem}
          </p>
        )}

        <p className="mt-3 text-[12px] leading-5 text-white/35">
          A sincronização pergunta ao Resend o último evento de cada e-mail enviado.
          O Resend limita a 2 consultas por segundo, então a lista inteira leva cerca
          de {Math.max(1, Math.round((leads.length * 0.46) / 5) * 5)} segundos hoje —
          deixe a aba aberta até terminar.
        </p>
      </div>

      {/* Busca e filtros */}
      <div className="mb-4 flex flex-wrap gap-2.5">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail, telefone ou CPF"
          className="h-11 min-w-[240px] flex-1 rounded-xl border border-white/12 bg-black/30 px-4 text-[14px] outline-none transition placeholder:text-white/25 focus:border-primary/60"
        />
        <select
          value={filtroOrigem}
          onChange={(e) => setFiltroOrigem(e.target.value)}
          className="h-11 rounded-xl border border-white/12 bg-black/30 px-3 text-[14px] outline-none focus:border-primary/60"
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
          className="h-11 rounded-xl border border-white/12 bg-black/30 px-3 text-[14px] outline-none focus:border-primary/60"
        >
          <option value="todos">Todos os status</option>
          {porStatus.map(([s, n]) => (
            <option key={s} value={s}>
              {ROTULO_STATUS[s] ?? s} ({n})
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[1000px] border-collapse text-left">
          <thead>
            <tr className="bg-white/[0.04] text-[11px] uppercase tracking-[0.1em] text-white/40">
              {["Pessoa", "Contato", "CPF", "Origem", "E-mail", "Cadastro", ""].map((h) => (
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
                className="border-t border-white/[0.07] align-top text-[13px] transition hover:bg-white/[0.02]"
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
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-white/60">
                  {l.cpf}
                </td>
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
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setEditando(l)}
                    className="rounded-lg border border-white/12 px-3 py-1.5 text-[12px] font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visiveis.length === 0 && (
          <p className="px-4 py-10 text-center text-[14px] text-white/35">
            {leads.length === 0
              ? "Nenhum cadastro na lista VIP ainda."
              : "Nenhum cadastro encontrado com esses filtros."}
          </p>
        )}
      </div>

      {editando && (
        <ModalEdicao lead={editando} aoFechar={() => setEditando(null)} />
      )}
    </main>
  );
}

/* ─── Edição ──────────────────────────────────────────────────────────────── */

function ModalEdicao({ lead, aoFechar }: { lead: LeadAdmin; aoFechar: () => void }) {
  const [erro, setErro] = useState("");
  const [salvando, iniciar] = useTransition();

  const campos = [
    { name: "nome", rotulo: "Nome completo", valor: lead.nome, tipo: "text" },
    { name: "email", rotulo: "E-mail", valor: lead.email, tipo: "email" },
    { name: "telefone", rotulo: "Telefone", valor: lead.telefone, tipo: "text" },
    { name: "cpf", rotulo: "CPF", valor: lead.cpf, tipo: "text" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={aoFechar}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl border border-white/12 bg-[#131318] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-[19px] font-bold tracking-tight">Editar cadastro</h2>
        <p className="mb-5 text-[12px] text-white/40">
          Entrou em {dataHora(lead.created_at)} · {ORIGEM_ROTULO[lead.origem] ?? lead.origem}
        </p>

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

          {campos.map((c) => (
            <label key={c.name} className="mb-3.5 block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
                {c.rotulo}
              </span>
              <input
                name={c.name}
                type={c.tipo}
                defaultValue={c.valor}
                className="h-12 w-full rounded-xl border border-white/12 bg-black/30 px-3.5 text-[14px] outline-none transition focus:border-primary/60"
              />
            </label>
          ))}

          {erro && (
            <p role="alert" className="mb-3 text-[13px] font-medium text-red-300">
              {erro}
            </p>
          )}

          <div className="mt-5 flex gap-2.5">
            <button
              type="submit"
              disabled={salvando}
              className="btn-primary flex-1 justify-center disabled:opacity-60"
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-full border border-white/12 px-5 text-[14px] font-semibold text-white/60 transition hover:border-white/25 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
