"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { lerComprovante, type Comprovante } from "@/lib/comprovante";
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
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-[28px] font-bold leading-tight tracking-tight text-white sm:text-[34px]">
          Não encontramos seu comprovante
        </h1>
        <p className="mb-8 text-[15px] leading-7 text-white/60">
          Isso acontece quando a página é aberta direto pelo link, em outro
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
    <div className="mx-auto max-w-[520px]">
      <div className="mb-8 text-center">
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
        <h1 className="mb-3 text-[28px] font-bold leading-tight tracking-tight text-white sm:text-[36px]">
          Boa, {firstName(dados.nome)}! Você está na lista VIP.
        </h1>
        <p className="text-[15px] leading-7 text-white/55">
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
            <Campo rotulo="Day use" valor={`Até as ${EVENTO.dayUseAte}`} />
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

      {/* Sorteio */}
      <div className="mt-6 rounded-panel border border-r2/30 bg-r2/10 p-5">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-r2">
          Você também está concorrendo
        </p>
        <p className="text-[16px] font-semibold leading-snug text-white">
          {SORTEIO.atracoes}
        </p>
        <p className="mt-1 text-[13px] text-white/50">
          {SORTEIO.data} · {SORTEIO.hora} · {SORTEIO.local}
        </p>
      </div>

      <p className="mt-6 text-center text-[13px] leading-6 text-white/40">
        As vagas são limitadas e o cadastro não garante o ingresso. Avisaremos por
        WhatsApp e e-mail quando as vendas abrirem.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href={SOMMA.links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full sm:w-auto"
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
