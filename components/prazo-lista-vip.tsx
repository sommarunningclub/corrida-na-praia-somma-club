"use client";

import { useEffect, useState } from "react";
import { LISTA_VIP, LISTA_VIP_PRAZO } from "@/lib/napraia-data";

type Partes = { dias: string; horas: string; min: string; seg: string };

const VAZIO: Partes = { dias: "--", horas: "--", min: "--", seg: "--" };
const UNIDADES: Array<[keyof Partes, string]> = [
  ["dias", "dias"],
  ["horas", "horas"],
  ["min", "min"],
  ["seg", "seg"],
];

function restante(alvo: number): { partes: Partes; encerrado: boolean } {
  const ms = alvo - Date.now();
  if (ms <= 0) {
    return { partes: { dias: "00", horas: "00", min: "00", seg: "00" }, encerrado: true };
  }
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    partes: {
      dias: pad(Math.floor(s / 86400)),
      horas: pad(Math.floor((s % 86400) / 3600)),
      min: pad(Math.floor((s % 3600) / 60)),
      seg: pad(s % 60),
    },
    encerrado: false,
  };
}

/**
 * Contagem regressiva até o fechamento das inscrições na lista VIP.
 * O primeiro render é sempre "--" para o HTML do servidor bater com o do
 * cliente; o valor real entra no efeito, já no navegador.
 */
export function PrazoListaVip({
  onEncerrar,
}: {
  onEncerrar?: (encerrado: boolean) => void;
}) {
  const [partes, setPartes] = useState<Partes>(VAZIO);
  const [encerrado, setEncerrado] = useState(false);

  useEffect(() => {
    const alvo = new Date(LISTA_VIP_PRAZO).getTime();

    const tick = () => {
      const r = restante(alvo);
      setPartes(r.partes);
      setEncerrado(r.encerrado);
      onEncerrar?.(r.encerrado);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [onEncerrar]);

  if (encerrado) {
    return (
      <div className="rounded-panel border border-white/12 bg-white/[0.04] px-5 py-4 text-center">
        <p className="text-[15px] font-semibold text-white/80">
          {LISTA_VIP.prazoEncerrado}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-panel border border-primary/30 bg-primary/10 p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        {LISTA_VIP.prazoTitulo}
      </p>
      <div className="flex items-stretch gap-2">
        {UNIDADES.map(([chave, rotulo]) => (
          <div
            key={chave}
            className="flex-1 rounded-xl bg-black/25 px-2 py-2.5 text-center"
          >
            <span className="block text-[20px] font-semibold tabular-nums leading-none tracking-tight text-white sm:text-[24px]">
              {partes[chave]}
            </span>
            <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.14em] text-white/45 sm:text-[10px]">
              {rotulo}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-5 text-white/45">
        Depois desse prazo, o cadastro na lista VIP será encerrado.
      </p>
    </div>
  );
}
