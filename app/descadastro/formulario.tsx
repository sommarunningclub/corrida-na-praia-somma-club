"use client";

import { useActionState } from "react";
import { confirmarSaida, type EstadoSaida } from "./actions";

export function FormularioSaida({ token }: { token: string }) {
  const [estado, acao, enviando] = useActionState<EstadoSaida, FormData>(
    confirmarSaida,
    null
  );

  if (estado?.ok) {
    return (
      <div className="mt-4">
        <p className="text-[15px] leading-relaxed text-ink">{estado.mensagem}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Você continua na lista VIP da corrida: só não recebe mais os avisos por
          e-mail. Mudou de ideia? Responda a última mensagem que a gente te
          coloca de volta.
        </p>
      </div>
    );
  }

  return (
    <form action={acao} className="mt-4">
      <input type="hidden" name="t" value={token} />

      <p className="text-[15px] leading-relaxed text-muted">
        Ao confirmar, você deixa de receber os e-mails do Somma Club sobre a
        Corrida na Praia. Seu cadastro na lista VIP continua valendo.
      </p>

      {estado && !estado.ok && (
        <p role="alert" className="mt-4 text-[14px] font-medium text-primary">
          {estado.mensagem}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-6 min-h-[48px] w-full rounded-full bg-ink px-6 text-[15px] font-semibold text-white transition active:scale-[0.99] hover:bg-black disabled:opacity-60"
      >
        {enviando ? "Tirando você da lista…" : "Confirmar saída"}
      </button>
    </form>
  );
}
