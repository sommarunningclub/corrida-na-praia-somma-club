import { AGENDA, EVENTO } from "@/lib/napraia-data";

/**
 * "Salve a data": adiciona a Corrida na Praia ao calendário da pessoa.
 *
 * Os links vão para a Agenda Somma Club, onde o evento está publicado. Ela
 * devolve o .ics (Apple e genérico) ou redireciona para o Google e o Outlook
 * com os dados do evento. Assim data, hora e local têm um dono só: se a
 * organização confirmar o horário da largada lá, os botões daqui já refletem.
 *
 * Sem estado e sem JS: são três âncoras. Por isso funciona igual dentro de um
 * componente de servidor (Cronograma, Inscrição) e de cliente (Obrigado).
 */

type Variante = "claro" | "escuro" | "compacto";

export function AgendaEvento({
  variante = "claro",
  className = "",
  emColuna = false,
}: {
  variante?: Variante;
  className?: string;
  /** Empilha os apps em uma coluna. Para espaços estreitos, como o painel
   *  flutuante, onde três colunas espremem os rótulos em duas linhas. */
  emColuna?: boolean;
}) {
  if (variante === "compacto") return <Compacto className={className} />;

  const escuro = variante === "escuro";

  return (
    <div
      className={`rounded-panel p-5 sm:p-6 ${
        escuro
          ? "border border-white/10 bg-white/[0.04]"
          : "border border-black/[0.08] bg-white shadow-card"
      } ${className}`}
    >
      <div className="mb-5 flex items-start gap-4">
        <span className="icon-box shrink-0" aria-hidden>
          <IconeCalendario />
        </span>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            {AGENDA.eyebrow}
          </p>
          <p
            className={`text-[17px] font-semibold leading-snug sm:text-[19px] ${
              escuro ? "text-white" : "text-ink"
            }`}
          >
            {AGENDA.titulo}
          </p>
          <p
            className={`mt-1.5 text-[14px] leading-6 ${
              escuro ? "text-white/50" : "text-muted"
            }`}
          >
            {AGENDA.descricao}
          </p>
        </div>
      </div>

      <ul className={`grid gap-2.5 ${emColuna ? "" : "sm:grid-cols-3"}`}>
        {AGENDA.apps.map((app) => (
          <li key={app.key}>
            <a
              href={app.href}
              {...(app.novaAba
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`flex min-h-[56px] w-full flex-col justify-center rounded-card border px-4 py-2.5 transition-colors duration-200 active:scale-[0.98] ${
                escuro
                  ? "border-white/12 bg-white/[0.03] hover:border-white/30"
                  : "border-black/10 bg-white hover:border-black/25"
              }`}
            >
              <span
                className={`text-[14px] font-semibold leading-tight ${
                  escuro ? "text-white" : "text-ink"
                }`}
              >
                {app.label}
              </span>
              <span
                className={`mt-0.5 text-[12px] leading-tight ${
                  escuro ? "text-white/40" : "text-muted"
                }`}
              >
                {app.hint}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p
        className={`mt-4 text-[12px] leading-5 ${
          escuro ? "text-white/35" : "text-muted"
        }`}
      >
        {EVENTO.dataExtenso}, no {EVENTO.local.nome}. O horário da largada será
        atualizado na agenda assim que a organização confirmar.{" "}
        <a
          href={AGENDA.pagina}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Ver na Agenda Somma Club
        </a>
      </p>
    </div>
  );
}

/** Versão de uma linha, para o hero: sem card, só a ação. */
function Compacto({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-2 ${className}`}>
      {/* basis-full: no mobile o rótulo fica em uma linha só e os três botões
          cabem juntos na linha de baixo. */}
      <span className="inline-flex basis-full items-center gap-2 text-[13px] font-medium text-white/50 sm:basis-auto">
        <span className="text-primary" aria-hidden>
          <IconeCalendario className="h-4 w-4" />
        </span>
        Salve a data:
      </span>
      {AGENDA.apps.map((app) => (
        <a
          key={app.key}
          href={app.href}
          {...(app.novaAba ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex min-h-[36px] items-center rounded-full border border-white/15 bg-white/[0.06] px-3.5 text-[13px] font-semibold text-white/85 transition-colors duration-200 hover:border-white/35 active:scale-[0.97]"
        >
          <span className="sm:hidden">{app.curto}</span>
          <span className="hidden sm:inline">{app.label}</span>
        </a>
      ))}
    </div>
  );
}

export function IconeCalendario({
  className = "h-[18px] w-[18px]",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
