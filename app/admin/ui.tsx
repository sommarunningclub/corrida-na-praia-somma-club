"use client";

import { useEffect, type ReactNode } from "react";
import { ROTULO_STATUS } from "@/lib/admin-tipos";

/* ─── Status de e-mail ────────────────────────────────────────────────────── */

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

/** Não chegaram ao destinatário. */
export const PROBLEMAS = ["bounced", "complained", "suppressed", "failed"];
/** Chegaram — abertura e clique implicam entrega. */
export const CHEGARAM = ["delivered", "opened", "clicked"];

/**
 * Os cartões do resumo agrupam vários eventos ("Não chegaram" são quatro
 * status distintos), então o filtro aceita tanto um evento solto quanto um
 * desses grupos.
 */
export const GRUPO_CHEGARAM = "grupo:chegaram";
export const GRUPO_PROBLEMAS = "grupo:problemas";
/** Quem abriu — um clique pressupõe a abertura, então entra aqui também. */
export const GRUPO_ABERTOS = "grupo:abertos";
export const ABERTOS = ["opened", "clicked"];

export function combinaStatus(filtro: string, status: string | null): boolean {
  const s = status ?? "nao_enviado";
  if (filtro === "todos") return true;
  if (filtro === GRUPO_CHEGARAM) return CHEGARAM.includes(s);
  if (filtro === GRUPO_PROBLEMAS) return PROBLEMAS.includes(s);
  if (filtro === GRUPO_ABERTOS) return ABERTOS.includes(s);
  return s === filtro;
}

export function Selo({ status }: { status: string | null }) {
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

export function dataHora(iso: string | null): string {
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

export function telefoneVisivel(t: string): string {
  const d = (t ?? "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t || "—";
}

/* ─── Folha modal ─────────────────────────────────────────────────────────── */

/**
 * No celular sobe do rodapé como bottom sheet; no desktop é uma caixa
 * centrada. Trava o scroll do fundo e fecha no Esc, como um app nativo.
 */
export function Folha({
  titulo,
  subtitulo,
  aoFechar,
  children,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  aoFechar: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", onKey);
    };
  }, [aoFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={aoFechar}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className="max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-white/12 bg-[#131318] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-h-[88dvh] sm:max-w-[480px] sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Puxador: dá o affordance de folha arrastável do iOS */}
        <div className="sticky top-0 z-10 rounded-t-3xl bg-[#131318] px-5 pt-3 sm:px-6">
          <div
            aria-hidden
            className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/20 sm:hidden"
          />
          <div className="flex items-start justify-between gap-3 pb-3">
            <div className="min-w-0">
              <h2 className="truncate text-[19px] font-bold tracking-tight">{titulo}</h2>
              {subtitulo && (
                <p className="mt-0.5 text-[12px] text-white/40">{subtitulo}</p>
              )}
            </div>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="-mr-1 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

/* ─── Campo de formulário ─────────────────────────────────────────────────── */

/** text-[16px] não é estética: abaixo disso o iOS dá zoom ao focar o campo. */
export function Campo({
  name,
  rotulo,
  valor,
  tipo = "text",
  modo,
  autoFocus,
}: {
  name: string;
  rotulo: string;
  valor?: string;
  tipo?: string;
  modo?: "tel" | "email" | "numeric";
  autoFocus?: boolean;
}) {
  return (
    <label className="mb-3.5 block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
        {rotulo}
      </span>
      <input
        name={name}
        type={tipo}
        defaultValue={valor}
        inputMode={modo}
        autoFocus={autoFocus}
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-white/12 bg-black/30 px-3.5 text-[16px] outline-none transition focus:border-primary/60"
      />
    </label>
  );
}
