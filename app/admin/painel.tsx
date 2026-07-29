"use client";

import { useState } from "react";
import { sair } from "@/app/admin/actions";
import { Inscritos } from "@/app/admin/inscritos";
import { Disparos } from "@/app/admin/disparos";
import type { LeadAdmin } from "@/lib/admin-tipos";
import type { Papel } from "@/lib/admin-auth";

type Aba = "inscritos" | "disparos";

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
        className: "select-none",
      }
    : {};

  return (
    <main
      {...travas}
      className={`mx-auto max-w-[1400px] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:px-8 lg:pt-8 ${
        travas.className ?? ""
      }`}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary sm:text-[11px]">
            Corrida na Praia · 06.09.2026
          </p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-[24px] font-bold leading-tight tracking-tight sm:text-[32px]">
            Lista VIP
            {soLeitura && (
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
                Somente leitura
              </span>
            )}
          </h1>
        </div>
        <form action={sair}>
          <button className="min-h-[40px] rounded-full border border-white/12 px-4 text-[13px] font-semibold text-white/60 transition active:scale-[0.97] hover:border-white/25 hover:text-white">
            Sair
          </button>
        </form>
      </header>

      {erroCarga && (
        <p className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-200">
          {erroCarga}
        </p>
      )}

      {/* Abas no estilo segmented control do iOS */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
        {(
          [
            ["inscritos", "Inscritos"],
            ["disparos", "Disparos"],
          ] as Array<[Aba, string]>
        ).map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={`min-h-[40px] rounded-full text-[14px] font-semibold transition ${
              aba === chave ? "bg-white text-[#0b0b0f]" : "text-white/55 hover:text-white"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "inscritos" ? (
        <Inscritos leads={leads} fechada={fechada} papel={papel} />
      ) : (
        <Disparos leads={leads} />
      )}
    </main>
  );
}
