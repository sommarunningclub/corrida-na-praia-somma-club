"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { EVENTO } from "@/lib/napraia-data";

type Parts = { dias: string; horas: string; min: string; seg: string };

const ZERO: Parts = { dias: "--", horas: "--", min: "--", seg: "--" };
const LABELS: Array<[keyof Parts, string]> = [
  ["dias", "dias"],
  ["horas", "horas"],
  ["min", "min"],
  ["seg", "seg"],
];

function diff(target: number): { parts: Parts; acabou: boolean } {
  const ms = target - Date.now();
  if (ms <= 0) return { parts: { dias: "00", horas: "00", min: "00", seg: "00" }, acabou: true };
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    parts: {
      dias: pad(Math.floor(s / 86400)),
      horas: pad(Math.floor((s % 86400) / 3600)),
      min: pad(Math.floor((s % 3600) / 60)),
      seg: pad(s % 60),
    },
    acabou: false,
  };
}

/**
 * Contagem regressiva até a largada. O primeiro render é sempre "--"
 * para o HTML do servidor bater com o do cliente; o valor real entra
 * no efeito, já no browser.
 */
export function Countdown({ className }: { className?: string }) {
  const [parts, setParts] = useState<Parts>(ZERO);
  const [acabou, setAcabou] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const anterior = useRef<Parts>(ZERO);

  useEffect(() => {
    const target = new Date(EVENTO.dataISO).getTime();

    const tick = () => {
      const { parts: next, acabou: fim } = diff(target);
      setParts(next);
      setAcabou(fim);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Pulso sutil no dígito que mudou — só nos segundos, para não poluir.
  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;
    if (anterior.current.seg === parts.seg) return;
    anterior.current = parts;
    const alvo = ref.current.querySelector('[data-unit="seg"] [data-value]');
    if (alvo) {
      gsap.fromTo(alvo, { opacity: 0.35, y: -4 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
    }
  }, [parts]);

  return (
    <div ref={ref} className={className}>
      <div className="flex items-stretch gap-2 sm:gap-3">
        {LABELS.map(([key, label]) => (
          <div
            key={key}
            data-unit={key}
            className="flex-1 rounded-2xl border border-white/12 bg-white/[0.06] px-2 py-3 text-center sm:px-4 sm:py-4"
          >
            <span
              data-value
              className="block font-semibold tabular-nums leading-none text-white text-[26px] tracking-tight sm:text-[34px] lg:text-[40px]"
            >
              {parts[key]}
            </span>
            <span className="mt-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/50 sm:text-[11px]">
              {label}
            </span>
          </div>
        ))}
      </div>
      {acabou && (
        <p className="mt-3 text-center text-sm font-medium text-primary">
          É hoje. Bora correr!
        </p>
      )}
    </div>
  );
}
