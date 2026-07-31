import type { Metadata } from "next";
import { SOMMA } from "@/lib/napraia-data";
import { FormularioSaida } from "./formulario";

export const metadata: Metadata = {
  title: "Sair da lista · Somma Club",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DescadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-navy-deep px-5 py-16">
      <div className="w-full max-w-[440px] rounded-panel bg-white p-7 sm:p-9">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          {SOMMA.nome}
        </p>
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-display text-ink">
          Sair da lista de e-mails
        </h1>

        {t ? (
          <FormularioSaida token={t} />
        ) : (
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Este link está incompleto. Abra o link direto do e-mail que você
            recebeu, ou responda a mensagem que a gente tira você da lista.
          </p>
        )}
      </div>
    </main>
  );
}
