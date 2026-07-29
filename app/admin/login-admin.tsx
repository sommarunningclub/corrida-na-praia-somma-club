"use client";

import { useActionState } from "react";
import { entrar, type EstadoAcao } from "@/app/admin/actions";

export function LoginAdmin() {
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(entrar, null);

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Corrida na Praia
          </p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight">
            Painel da Lista VIP
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-white/45">
            Área restrita da equipe. Informe o código de acesso.
          </p>
        </div>

        <form action={acao} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <label
            htmlFor="codigo"
            className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50"
          >
            Código de acesso
          </label>
          <input
            id="codigo"
            name="codigo"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            className="h-[52px] w-full rounded-xl border border-white/12 bg-black/30 px-4 text-[15px] text-white outline-none transition placeholder:text-white/25 focus:border-primary/60"
            placeholder="••••••••••"
          />

          {estado && !estado.ok && (
            <p role="alert" className="mt-3 text-[13px] font-medium text-primary">
              {estado.mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={pendente}
            className="btn-primary mt-5 w-full justify-center disabled:opacity-60"
          >
            {pendente ? "Verificando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] leading-5 text-white/25">
          A sessão vale por 12 horas neste navegador.
        </p>
      </div>
    </main>
  );
}
