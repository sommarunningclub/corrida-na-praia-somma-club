"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { lerComprovante, type Comprovante } from "@/lib/comprovante";
import { AgendaEvento } from "@/components/agenda-evento";
import { EVENTO, SOMMA, SORTEIO } from "@/lib/napraia-data";
import { firstName } from "@/lib/validation";

type Estado = "carregando" | "ok" | "vazio";

export function ObrigadoTicket() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [dados, setDados] = useState<Comprovante | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = lerComprovante();
    setDados(c);
    setEstado(c ? "ok" : "vazio");
  }, []);

  // Entrada do ticket, como se ele fosse emitido na hora.
  useEffect(() => {
    if (estado !== "ok" || !ticketRef.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ticketRef.current,
        { opacity: 0, y: 40, rotateX: -8 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.9, ease: "power3.out" }
      );
      gsap.fromTo(
        "[data-linha-ticket]",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, delay: 0.35, ease: "power2.out" }
      );
    }, ticketRef);
    return () => ctx.revert();
  }, [estado]);

  if (estado === "carregando") {
    return <div className="min-h-[420px]" aria-hidden />;
  }

  // Acesso direto à URL, sem ter passado pelo formulário.
  if (estado === "vazio" || !dados) {
    return (
      <div className="mx-auto max-w-md px-1 text-center">
        <h1 className="mb-4 text-[28px] font-bold leading-tight tracking-tight text-white sm:text-[34px]">
          Não encontramos seu comprovante
        </h1>
        <p className="mb-8 text-[15px] leading-7 text-white/60">
          Isso acontece quando a página é aberta diretamente pelo link, em outro
          navegador ou depois de fechar a aba. Se você já se cadastrou, está tudo
          certo: seu lugar na lista VIP continua garantido.
        </p>
        <a href="/" className="btn-primary">
          Voltar para o site
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-9 text-center sm:mb-10">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-primary">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="#fff"
            strokeWidth={2.5}
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mb-3 text-balance px-1 text-[27px] font-bold leading-[1.15] tracking-tight text-white sm:text-[34px]">
          Boa, {firstName(dados.nome)}! Você está na lista VIP.
        </h1>
        <p className="mx-auto max-w-[42ch] text-[15px] leading-7 text-white/55">
          Guarde este comprovante. Você será avisado assim que as vendas abrirem,
          antes do público geral.
        </p>
      </div>

      {/* Ticket */}
      <div
        ref={ticketRef}
        className="relative overflow-hidden rounded-panel bg-cream text-ink shadow-lift"
      >
        {/* Cabeçalho do ticket — navy mais claro que o fundo da página,
            senão o topo do ticket se dissolve contra ele. */}
        <div className="flex items-center justify-between gap-4 bg-navy px-6 py-5 sm:px-8">
          <Image
            src={SOMMA.logo}
            alt={SOMMA.nome}
            width={101}
            height={27}
            className="h-[27px] w-auto"
          />
          <span className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            Lista VIP
          </span>
        </div>

        {/* Corpo */}
        <div className="px-6 pb-7 pt-7 sm:px-8">
          <p data-linha-ticket className="eyebrow mb-2">
            {EVENTO.nome}
          </p>
          <p
            data-linha-ticket
            className="mb-7 text-[26px] font-bold leading-[1.1] tracking-display sm:text-[32px]"
          >
            {EVENTO.dataExtenso}
          </p>

          <dl data-linha-ticket className="mb-7 grid grid-cols-2 gap-x-4 gap-y-5">
            <Campo rotulo="Distância" valor={EVENTO.distancia} />
            <Campo rotulo="Day use" valor={`Até às ${EVENTO.dayUseAte}`} />
            <Campo rotulo="Local" valor={EVENTO.local.nome} />
            <Campo rotulo="Largada" valor="A confirmar" />
          </dl>

          {/* Confirmação dos dados do cadastro */}
          <div
            data-linha-ticket
            className="rounded-card border border-ink/10 bg-white/60 p-5"
          >
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Seus dados
            </p>
            <dl className="space-y-3">
              <Campo rotulo="Nome" valor={dados.nome} largo />
              <Campo rotulo="E-mail" valor={dados.email} largo quebra />
              {dados.telefone && <Campo rotulo="Telefone" valor={dados.telefone} largo />}
              {dados.cpfMascarado && (
                <Campo rotulo="CPF" valor={dados.cpfMascarado} largo />
              )}
            </dl>
          </div>
        </div>

        {/* Perfuração */}
        <div className="relative">
          <span
            aria-hidden
            className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-navy-deep"
          />
          <span
            aria-hidden
            className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-navy-deep"
          />
          <div
            aria-hidden
            className="mx-6 border-t-2 border-dashed border-ink/15 sm:mx-8"
          />
        </div>

        {/* Canhoto */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 sm:px-8">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Código
            </p>
            <p className="font-mono text-[17px] font-bold tracking-wider text-ink">
              {dados.codigo ?? "NP-VIP"}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Status
            </p>
            <p className="text-[15px] font-bold text-primary">Confirmado</p>
          </div>
        </div>
      </div>

      {/* Primeira ação depois do comprovante: garantir que a data não se perca.
          O aviso de abertura das vendas vem pelo WhatsApp, mas o domingo do
          evento a pessoa já bloqueia agora. */}
      <AgendaEvento variante="escuro" className="mt-5" />

      {/* Sorteio */}
      <div className="mt-5 rounded-panel border border-r2/30 bg-r2/10 p-5 sm:p-6">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-r2">
          Você também está concorrendo
        </p>
        <p className="text-[16px] font-semibold leading-snug text-white">
          {SORTEIO.atracoes}
        </p>
        <p className="mt-1 text-[13px] text-white/50">
          Show · {SORTEIO.showDia} · {SORTEIO.hora} · {SORTEIO.local}
        </p>
        <p className="mt-2 text-[13px] font-semibold text-r2">
          Sorteio · {SORTEIO.sorteioDia}
        </p>
      </div>

      <p className="mx-auto mt-6 max-w-[44ch] px-2 text-center text-[13px] leading-6 text-white/40">
        As vagas são limitadas e o cadastro não garante o ingresso. Avisaremos você
        pelo WhatsApp assim que as vendas abrirem.
      </p>

      {/* Boas-vindas de quem acabou de entrar na comunidade */}
      {dados.novoMembro && (
        <div className="mt-6 rounded-panel border border-primary/30 bg-primary/10 p-5 sm:p-6">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Bem-vindo ao Somma Club
          </p>
          <p className="mb-2 text-[17px] font-semibold leading-snug text-white">
            Agora você é da comunidade
          </p>
          <p className="mb-5 text-[14px] leading-6 text-white/55">
            Entre no grupo do WhatsApp para acompanhar os treinos, os eventos e o
            aviso de abertura das vendas.
          </p>
          <a
            href={SOMMA.links.grupo || SOMMA.links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full sm:w-auto"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 18.13c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.21-8.24 8.21Z" />
            </svg>
            Entrar no grupo do Somma
          </a>
        </div>
      )}

      {/* Chamar alguém para correr junto */}
      <div className="mt-6 rounded-panel border border-white/10 bg-white/[0.04] p-5 text-center sm:p-6">
        <p className="mb-2 text-[17px] font-semibold leading-snug text-white">
          Corrida boa é com gente boa junto
        </p>
        <p className="mx-auto mb-5 max-w-[38ch] text-[14px] leading-6 text-white/50">
          Chame quem você quer ver na largada. As vagas são limitadas para todo
          mundo.
        </p>
        <BotaoCompartilhar />
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href={SOMMA.links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost-dark w-full sm:w-auto"
        >
          Seguir o @somma.club
        </a>
        <a href="/" className="btn-ghost-dark w-full sm:w-auto">
          Voltar para o site
        </a>
      </div>
    </div>
  );
}

const TEXTO_CONVITE = `Vou correr a ${EVENTO.nome}, ${EVENTO.dataCurta}, no ${EVENTO.local.nome}. São ${EVENTO.distancia} e o day use vai até às ${EVENTO.dayUseAte}. As vagas são limitadas. Entra na lista VIP comigo:`;

/** Compartilhamento nativo quando o aparelho oferece (padrão no iOS e
 *  Android) e WhatsApp como alternativa no desktop. */
function BotaoCompartilhar() {
  const [copiado, setCopiado] = useState(false);
  const [temShareNativo, setTemShareNativo] = useState(false);

  useEffect(() => {
    setTemShareNativo(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const url = typeof window !== "undefined" ? window.location.origin : "";
  const mensagem = `${TEXTO_CONVITE} ${url}`;

  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: EVENTO.nome, text: TEXTO_CONVITE, url });
        return;
      } catch {
        // Compartilhamento cancelado pela pessoa: não é erro.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <button type="button" onClick={compartilhar} className="btn-primary w-full sm:w-auto">
        {copiado ? "Convite copiado!" : temShareNativo ? "Chamar alguém" : "Copiar convite"}
        {!copiado && (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.59 13.51 6.83 3.98M15.41 6.51 8.59 10.49" />
          </svg>
        )}
      </button>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost-dark w-full sm:w-auto"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 18.13c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.21-8.24 8.21Z" />
        </svg>
        Enviar no WhatsApp
      </a>
    </div>
  );
}

function Campo({
  rotulo,
  valor,
  largo = false,
  quebra = false,
}: {
  rotulo: string;
  valor: string;
  largo?: boolean;
  quebra?: boolean;
}) {
  return (
    <div className={largo ? "flex flex-col gap-0.5 sm:flex-row sm:gap-4" : ""}>
      <dt
        className={`text-[10px] font-semibold uppercase tracking-[0.16em] text-muted ${
          largo ? "sm:w-20 sm:shrink-0 sm:pt-[3px]" : "mb-1"
        }`}
      >
        {rotulo}
      </dt>
      <dd
        className={`text-[15px] font-medium leading-6 text-ink ${
          quebra ? "break-all" : ""
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}
