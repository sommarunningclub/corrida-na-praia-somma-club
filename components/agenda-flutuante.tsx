"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AgendaEvento, IconeCalendario } from "@/components/agenda-evento";
import { useMenuAberto, useMostrarFlutuante } from "@/lib/flutuantes";

/**
 * Botão flutuante que abre o painel de "adicionar à agenda".
 *
 * Sob demanda, nunca por conta própria: a conversão principal da página é a
 * lista VIP e um pop-up automático disputaria a atenção com ela. Quem quer a
 * data acha o botão na hora que quiser.
 *
 * No mobile ele mora acima da CtaBar, que ocupa o rodapé. Como as duas usam a
 * mesma regra de visibilidade (lib/flutuantes), a CtaBar está sempre presente
 * quando este botão está, e o deslocamento é fixo em vez de calculado.
 *
 * O conteúdo do painel é o próprio AgendaEvento, então copy e links continuam
 * vivendo em um lugar só.
 */
export function AgendaFlutuante() {
  const mostrar = useMostrarFlutuante();
  const menuAberto = useMenuAberto();
  const [aberto, setAberto] = useState(false);

  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const painelId = useId();

  const visivel = mostrar && !menuAberto;

  const fechar = useCallback((devolverFoco = true) => {
    setAberto(false);
    if (devolverFoco) botaoRef.current?.focus();
  }, []);

  // O botão saiu de cena com o painel aberto (rolagem, menu): fecha junto, mas
  // sem puxar o foco de volta para um botão que a pessoa não está mais vendo.
  useEffect(() => {
    if (!visivel) setAberto(false);
  }, [visivel]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        fechar();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto, fechar]);

  // Foco entra no painel ao abrir, para leitor de tela e teclado.
  useEffect(() => {
    if (aberto) painelRef.current?.focus();
  }, [aberto]);

  return (
    <>
      {/* Escurecido no mobile, captura de clique no desktop. Fecha ao tocar
          fora sem virar um alvo de tabulação. */}
      {aberto && (
        <div
          aria-hidden
          onClick={() => fechar(false)}
          className="fixed inset-0 z-[44] bg-black/60 lg:bg-transparent"
        />
      )}

      {/* O painel fica FORA do container animado de propósito: aquele usa
          transform, e transform cria bloco de contenção para filhos position
          fixed. Dentro dele o painel se mediria pelo botão, não pela tela. */}
      {aberto && (
        <div
          ref={painelRef}
          id={painelId}
          role="dialog"
          aria-label="Adicionar a Corrida na Praia à sua agenda"
          tabIndex={-1}
          // Clicou num dos apps: a pessoa já foi para o calendário dela.
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) fechar(false);
          }}
          className="fixed inset-x-3 bottom-3 z-[45] rounded-panel bg-navy-deep shadow-lift outline-none lg:inset-x-auto lg:right-4 lg:bottom-[5.25rem] lg:w-[380px]"
        >
            <button
              type="button"
              onClick={() => fechar()}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

          <AgendaEvento variante="escuro" emColuna />
        </div>
      )}

      {/* 6.25rem no mobile deixa o botão acima da CtaBar com folga. As duas
          aparecem e somem juntas (mesma regra), então o valor é fixo. */}
      {/* No mobile o painel é uma folha que sobe do rodapé e cobre a área do
          botão, então o botão sai de cena enquanto ela está aberta (a folha
          tem o próprio ✕). No desktop o painel abre acima dele, sem tapar. */}
      <div
        className={`fixed bottom-[calc(6.25rem+var(--safe-bottom))] right-4 z-[45] transition-[transform,opacity] duration-300 ease-out lg:bottom-6 ${
          visivel
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        } ${aberto ? "max-lg:pointer-events-none max-lg:opacity-0" : ""}`}
      >
        <button
          ref={botaoRef}
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls={aberto ? painelId : undefined}
          tabIndex={visivel ? 0 : -1}
          className="glass-dark inline-flex min-h-[48px] items-center gap-2.5 rounded-full border border-white/15 px-5 text-[14px] font-semibold text-white shadow-lift transition-transform duration-200 hover:border-white/35 active:scale-[0.97]"
        >
          <span className="text-primary" aria-hidden>
            <IconeCalendario className="h-[18px] w-[18px]" />
          </span>
          Salve a data
        </button>
      </div>
    </>
  );
}
