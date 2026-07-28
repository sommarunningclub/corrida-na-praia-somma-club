"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isValidCpf, maskCpf, maskPhone, onlyDigits } from "@/lib/validation";
import { guardarComprovante, mascararCpf } from "@/lib/comprovante";

type Campo = "nome" | "email" | "telefone" | "cpf";
type Valores = Record<Campo, string>;
type Erros = Partial<Record<Campo, string>>;

const VAZIO: Valores = { nome: "", email: "", telefone: "", cpf: "" };

const CAMPOS: Array<{
  id: Campo;
  label: string;
  placeholder: string;
  type: string;
  inputMode?: "text" | "email" | "numeric" | "tel";
  autoComplete: string;
  maxLength?: number;
  enterKeyHint?: "next" | "done";
}> = [
  {
    id: "nome",
    label: "Nome completo",
    placeholder: "Maria Silva Santos",
    type: "text",
    autoComplete: "name",
    maxLength: 120,
    enterKeyHint: "next",
  },
  {
    id: "email",
    label: "E-mail",
    placeholder: "voce@email.com",
    type: "email",
    inputMode: "email",
    autoComplete: "email",
    enterKeyHint: "next",
  },
  {
    id: "telefone",
    label: "Telefone",
    placeholder: "(61) 99999-9999",
    type: "tel",
    inputMode: "tel",
    autoComplete: "tel-national",
    maxLength: 15,
    enterKeyHint: "next",
  },
  {
    id: "cpf",
    label: "CPF",
    placeholder: "000.000.000-00",
    type: "text",
    inputMode: "numeric",
    autoComplete: "off",
    maxLength: 14,
    enterKeyHint: "done",
  },
];

function validar(campo: Campo, valor: string): string | undefined {
  const v = valor.trim();
  switch (campo) {
    case "nome":
      if (v.length < 3) return "Informe seu nome completo.";
      if (v.split(/\s+/).length < 2) return "Informe nome e sobrenome.";
      return;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "E-mail inválido.";
      return;
    case "telefone": {
      const d = onlyDigits(v);
      if (d.length !== 10 && d.length !== 11) return "Telefone inválido. Use DDD + número.";
      return;
    }
    case "cpf":
      if (!isValidCpf(v)) return "CPF inválido.";
      return;
  }
}

export function ListaVipForm() {
  const [valores, setValores] = useState<Valores>(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [tocado, setTocado] = useState<Partial<Record<Campo, boolean>>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState("");
  const [utm, setUtm] = useState<Record<string, string>>({});

  const honeypot = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Guarda as UTMs da URL para salvar junto com o lead.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const capturadas: Record<string, string> = {};
    (["utm_source", "utm_medium", "utm_campaign"] as const).forEach((k) => {
      const v = p.get(k);
      if (v) capturadas[k] = v.slice(0, 120);
    });
    setUtm(capturadas);
  }, []);

  const alterar = (campo: Campo, bruto: string) => {
    const valor =
      campo === "cpf" ? maskCpf(bruto) : campo === "telefone" ? maskPhone(bruto) : bruto;
    setValores((v) => ({ ...v, [campo]: valor }));
    // Só limpa o erro enquanto digita; não cria erro novo antes do blur.
    if (erros[campo] && !validar(campo, valor)) {
      setErros((e) => ({ ...e, [campo]: undefined }));
    }
  };

  const sair = (campo: Campo) => {
    setTocado((t) => ({ ...t, [campo]: true }));
    setErros((e) => ({ ...e, [campo]: validar(campo, valores[campo]) }));
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErroGeral("");

    const novos: Erros = {};
    (Object.keys(VAZIO) as Campo[]).forEach((c) => {
      const erro = validar(c, valores[c]);
      if (erro) novos[c] = erro;
    });

    if (Object.keys(novos).length > 0) {
      setErros(novos);
      setTocado({ nome: true, email: true, telefone: true, cpf: true });
      const primeiro = (Object.keys(novos) as Campo[])[0];
      document.getElementById(primeiro)?.focus();
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch("/api/lista-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...valores,
          website: honeypot.current?.value ?? "",
          ...utm,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErroGeral(dados?.error ?? "Não foi possível concluir. Tente novamente.");
        if (dados?.fields) {
          const doServidor: Erros = {};
          (Object.keys(dados.fields) as Campo[]).forEach((k) => {
            const msg = dados.fields[k]?.[0];
            if (msg) doServidor[k] = msg;
          });
          setErros((e) => ({ ...e, ...doServidor }));
        }
        setEnviando(false);
        return;
      }

      // Guarda o comprovante para a página de obrigado montar o ticket.
      // O CPF vai mascarado: não há motivo para deixar o número cru no storage.
      guardarComprovante({
        nome: valores.nome.trim(),
        email: valores.email.trim().toLowerCase(),
        telefone: valores.telefone.trim(),
        cpfMascarado: mascararCpf(valores.cpf),
        codigo: typeof dados?.codigo === "string" ? dados.codigo : null,
      });

      router.push("/obrigado");
    } catch {
      setErroGeral("Falha de conexão. Verifique sua internet e tente de novo.");
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="rounded-panel border border-white/10 bg-dark-card p-6 sm:p-8 lg:p-10"
    >
      {/* Honeypot: invisível para humanos, irresistível para bots. */}
      <input
        ref={honeypot}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
      />

      <div className="space-y-5">
        {CAMPOS.map((campo) => {
          const erro = tocado[campo.id] ? erros[campo.id] : undefined;
          return (
            <div key={campo.id}>
              <label
                htmlFor={campo.id}
                className="mb-2 block text-[13px] font-medium text-white/70"
              >
                {campo.label}
              </label>
              <input
                id={campo.id}
                name={campo.id}
                type={campo.type}
                inputMode={campo.inputMode}
                autoComplete={campo.autoComplete}
                maxLength={campo.maxLength}
                enterKeyHint={campo.enterKeyHint}
                placeholder={campo.placeholder}
                value={valores[campo.id]}
                onChange={(e) => alterar(campo.id, e.target.value)}
                onBlur={() => sair(campo.id)}
                aria-invalid={Boolean(erro)}
                aria-describedby={erro ? `${campo.id}-erro` : undefined}
                disabled={enviando}
                className={`field border-white/12 bg-white/[0.04] text-white placeholder:text-white/25
                            focus:border-primary focus:ring-primary/25 disabled:opacity-60
                            ${erro ? "border-primary/70" : ""}`}
              />
              {erro && (
                <p id={`${campo.id}-erro`} className="mt-1.5 text-[13px] text-primary">
                  {erro}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {erroGeral && (
        <p role="alert" className="mt-5 rounded-xl bg-primary/10 px-4 py-3 text-[14px] text-primary">
          {erroGeral}
        </p>
      )}

      <button type="submit" disabled={enviando} className="btn-primary mt-7 w-full disabled:opacity-70">
        {enviando ? "Enviando…" : "Entrar na lista VIP"}
        {!enviando && <span aria-hidden>→</span>}
      </button>

      <p className="mt-4 text-center text-[12px] leading-5 text-white/35">
        Ao enviar, você concorda em receber os avisos do evento por e-mail. Seus dados
        são tratados conforme a LGPD e não são compartilhados com terceiros.
      </p>
    </form>
  );
}
