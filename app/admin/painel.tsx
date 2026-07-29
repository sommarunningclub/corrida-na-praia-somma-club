"use client";

import { useState } from "react";
import { sair } from "@/app/admin/actions";
import { Inscritos } from "@/app/admin/inscritos";
import { Disparos } from "@/app/admin/disparos";
import type { LeadAdmin } from "@/lib/admin-tipos";
import type { Papel } from "@/lib/admin-auth";

type Aba = "inscritos" | "disparos";

const ICONES: Record<Aba, React.ReactNode> = {
  inscritos: (
    <path
      d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10 8v-1.5a3.5 3.5 0 0 0-2.6-3.4M15 4.1a3.5 3.5 0 0 1 0 6.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  disparos: (
    <path
      d="M3 7.5 12 13l9-5.5M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export function Painel({
  leads,
  fechada,
  erroCarga,
  papel,
}: {
  leads: LeadAdmin[];
  fechada: boolean;
  erroCarga: string;
  papel: Papel;
}) {
  const [aba, setAba] = useState<Aba>("inscritos");
  const soLeitura = papel === "leitor";

  /**
   * No acesso somente leitura os dados ficam travados para cópia: sem seleção,
   * sem menu de contexto, sem arrastar, sem Ctrl+C. É um freio contra levar a
   * base embora, não um cofre — quem vê a tela ainda pode fotografar.
   */
  const travas = soLeitura
    ? {
        onCopy: (e: React.ClipboardEvent) => e.preventDefault(),
        onCut: (e: React.ClipboardEvent) => e.preventDefault(),
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        onDragStart: (e: React.DragEvent) => e.preventDefault(),
      }
    : {};

  const abas: Array<[Aba, string]> = [
    ["inscritos", "Inscritos"],
    ["disparos", "Disparos"],
  ];

  return (
    <div {...travas} className={soLeitura ? "select-none" : undefined}>
      {/* Segmented control só no desktop: no celular a navegação é a tab bar. */}
      <div className="mx-auto hidden max-w-[1400px] px-6 pt-8 lg:block lg:px-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Corrida na Praia · 06.09.2026
            </p>
            <h1 className="mt-1 flex items-center gap-2.5 text-[32px] font-bold leading-tight tracking-tight">
              Lista VIP
              {soLeitura && (
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
                  Somente leitura
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
              {abas.map(([chave, rotulo]) => (
                <button
                  key={chave}
                  type="button"
                  onClick={() => setAba(chave)}
                  className={`min-h-[40px] rounded-full px-8 text-[14px] font-semibold transition ${
                    aba === chave ? "bg-white text-[#0b0b0f]" : "text-white/55 hover:text-white"
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
            <form action={sair}>
              <button className="min-h-[40px] rounded-full border border-white/12 px-4 text-[13px] font-semibold text-white/60 transition hover:border-white/25 hover:text-white">
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-10">
        {erroCarga && (
          <p className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-200">
            {erroCarga}
          </p>
        )}

        {aba === "inscritos" ? (
          <Inscritos leads={leads} fechada={fechada} papel={papel} />
        ) : (
          <Disparos leads={leads} papel={papel} />
        )}
      </main>

      {/* Tab bar do iOS: fixa, translúcida, respeitando a safe area. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0b0b0f]/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="flex">
          {abas.map(([chave, rotulo]) => (
            <button
              key={chave}
              type="button"
              onClick={() => setAba(chave)}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition ${
                aba === chave ? "text-primary" : "text-white/40"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                {ICONES[chave]}
              </svg>
              <span className="text-[10px] font-semibold tracking-wide">{rotulo}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
