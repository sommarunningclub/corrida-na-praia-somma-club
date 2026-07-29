"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  isValidBirthDate,
  isValidCpf,
  maskCep,
  maskCpf,
  maskDate,
  maskPhone,
  onlyDigits,
} from "@/lib/validation";
import { guardarComprovante, mascararCpf } from "@/lib/comprovante";
import { LISTA_VIP_PRAZO, SOMMA } from "@/lib/napraia-data";

type Etapa = "cpf" | "confirmar" | "cadastro" | "ja_na_lista";
type Previa = { nome: string; email: string; telefone: string };
type CampoCadastro = "nome" | "email" | "telefone" | "data_nascimento" | "cep" | "sexo";
type Cadastro = Record<CampoCadastro, string>;
type Erros = Partial<Record<CampoCadastro | "cpf", string>>;

const CADASTRO_VAZIO: Cadastro = {
  nome: "",
  email: "",
  telefone: "",
  data_nascimento: "",
  cep: "",
  sexo: "",
};

function validarCampo(campo: CampoCadastro, valor: string): string | undefined {
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
      if (d.length !== 10 && d.length !== 11)
        return "Telefone inválido. Informe o DDD e o número.";
      return;
    }
    case "data_nascimento":
      if (!isValidBirthDate(v)) return "Data de nascimento inválida.";
      return;
    case "cep":
      if (onlyDigits(v).length !== 8) return "CEP inválido.";
      return;
    case "sexo":
      if (!v) return "Selecione uma opção.";
      return;
  }
}

/**
 * Entrada na lista VIP em etapas.
 *
 * 1. CPF: identifica se a pessoa já é da comunidade Somma.
 * 2a. Membro: confirma os dados (mostrados parcialmente) e entra na lista.
 * 2b. Novo: faz o cadastro de membro do clube e entra na lista na mesma ação.
 */
export function ListaVipForm() {
  const [etapa, setEtapa] = useState<Etapa>("cpf");
  const [cpf, setCpf] = useState("");
  const [token, setToken] = useState("");
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [cadastro, setCadastro] = useState<Cadastro>(CADASTRO_VAZIO);
  const [aceite, setAceite] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [encerrado, setEncerrado] = useState(false);

  const honeypot = useRef<HTMLInputElement>(null);
  // Guarda o último CPF já consultado para não repetir a busca.
  const ultimoConsultado = useRef("");
  const router = useRouter();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const capturadas: Record<string, string> = {};
    (["utm_source", "utm_medium", "utm_campaign"] as const).forEach((k) => {
      const v = p.get(k);
      if (v) capturadas[k] = v.slice(0, 120);
    });
    setUtm(capturadas);
    setEncerrado(Date.now() > new Date(LISTA_VIP_PRAZO).getTime());
  }, []);

  const irParaObrigado = (
    dados: { nome: string; email: string; telefone: string },
    codigo: string | null,
    novoMembro: boolean
  ) => {
    guardarComprovante({
      nome: dados.nome,
      email: (dados.email ?? "").toLowerCase(),
      telefone: dados.telefone ?? "",
      cpfMascarado: mascararCpf(cpf),
      codigo,
      novoMembro,
    });
    router.push("/obrigado");
  };

  /* ─── Etapa 1: identificar pelo CPF ────────────────────────────────────── */

  /**
   * Consulta a base e decide o caminho. Não existe "CPF inválido" aqui: quem
   * não está na base simplesmente cai no cadastro, que é o destino certo
   * tanto para quem digitou errado quanto para quem é novo de verdade.
   */
  const identificar = async (valor: string) => {
    const digitos = onlyDigits(valor);
    if (digitos.length !== 11 || enviando) return;

    // Evita repetir a consulta do mesmo CPF (efeito + submit manual).
    if (ultimoConsultado.current === digitos) return;
    ultimoConsultado.current = digitos;

    setErroGeral("");
    setEnviando(true);

    try {
      const resposta = await fetch("/api/lista-vip/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: digitos }),
      });
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        // Deixa tentar de novo com o mesmo CPF depois de uma falha.
        ultimoConsultado.current = "";
        setErroGeral(dados?.error ?? "Não foi possível verificar. Tente novamente.");
        return;
      }

      if (dados.status === "ja_na_lista") {
        setEtapa("ja_na_lista");
        return;
      }
      if (dados.status === "membro") {
        setToken(dados.token ?? "");
        setPrevia(dados.previa ?? null);
        setEtapa("confirmar");
        return;
      }
      // Não é da base: abre o cadastro na hora.
      setEtapa("cadastro");
    } catch {
      ultimoConsultado.current = "";
      setErroGeral("Falha de conexão. Verifique sua internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  };

  // Dispara sozinho assim que o CPF fica completo, sem precisar do botão.
  useEffect(() => {
    if (etapa !== "cpf") return;
    if (onlyDigits(cpf).length !== 11) return;
    const id = window.setTimeout(() => void identificar(cpf), 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpf, etapa]);

  const verificarCpf = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await identificar(cpf);
  };

  /* ─── Etapa 2a: membro confirma ────────────────────────────────────────── */

  const confirmarMembro = async () => {
    setErroGeral("");
    setEnviando(true);
    try {
      const resposta = await fetch("/api/lista-vip/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...utm }),
      });
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErroGeral(dados?.error ?? "Não foi possível concluir. Tente novamente.");
        // Token vencido: volta ao início para gerar outro.
        if (dados?.expirado) {
          setEtapa("cpf");
          setToken("");
        }
        setEnviando(false);
        return;
      }

      irParaObrigado(dados.dados ?? { nome: "", email: "", telefone: "" }, dados.codigo ?? null, false);
    } catch {
      setErroGeral("Falha de conexão. Verifique sua internet e tente de novo.");
      setEnviando(false);
    }
  };

  /* ─── Etapa 2b: novo membro ────────────────────────────────────────────── */

  const alterarCadastro = (campo: CampoCadastro, bruto: string) => {
    const valor =
      campo === "telefone"
        ? maskPhone(bruto)
        : campo === "data_nascimento"
          ? maskDate(bruto)
          : campo === "cep"
            ? maskCep(bruto)
            : bruto;
    setCadastro((c) => ({ ...c, [campo]: valor }));
    if (erros[campo] && !validarCampo(campo, valor)) {
      setErros((e) => ({ ...e, [campo]: undefined }));
    }
  };

  const enviarCadastro = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErroGeral("");

    const novos: Erros = {};
    (Object.keys(CADASTRO_VAZIO) as CampoCadastro[]).forEach((c) => {
      const erro = validarCampo(c, cadastro[c]);
      if (erro) novos[c] = erro;
    });

    if (!isValidCpf(cpf)) {
      novos.cpf = "Confira o CPF digitado.";
    }

    if (Object.keys(novos).length > 0) {
      setErros(novos);
      const primeiro = Object.keys(novos)[0];
      document
        .getElementById(primeiro === "cpf" ? "cpf-cadastro" : primeiro)
        ?.focus();
      return;
    }
    if (!aceite) {
      setErroGeral("É preciso aceitar o tratamento dos dados para continuar.");
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch("/api/lista-vip/novo-membro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cadastro,
          cpf,
          consent_lgpd: true,
          website: honeypot.current?.value ?? "",
          ...utm,
        }),
      });
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErroGeral(dados?.error ?? "Não foi possível concluir. Tente novamente.");
        if (dados?.fields) {
          const doServidor: Erros = {};
          (Object.keys(dados.fields) as CampoCadastro[]).forEach((k) => {
            const msg = dados.fields[k]?.[0];
            if (msg) doServidor[k] = msg;
          });
          setErros((e) => ({ ...e, ...doServidor }));
        }
        setEnviando(false);
        return;
      }

      irParaObrigado(
        { nome: cadastro.nome, email: cadastro.email, telefone: cadastro.telefone },
        dados.codigo ?? null,
        Boolean(dados.novoMembro)
      );
    } catch {
      setErroGeral("Falha de conexão. Verifique sua internet e tente de novo.");
      setEnviando(false);
    }
  };

  /* ─── Render ───────────────────────────────────────────────────────────── */

  const moldura = "rounded-panel border border-white/10 bg-dark-card p-6 sm:p-8 lg:p-10";

  if (encerrado) {
    return (
      <div className={`${moldura} text-center`}>
        <h3 className="mb-3 text-[22px] font-bold leading-tight text-white sm:text-[26px]">
          As inscrições na lista VIP foram encerradas
        </h3>
        <p className="mb-6 text-[15px] leading-7 text-white/60">
          O prazo terminou em 1º de agosto. Acompanhe o Instagram do Somma Club para
          saber da abertura das vendas para o público geral.
        </p>
        <a
          href={SOMMA.links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Seguir o @somma.club
        </a>
      </div>
    );
  }

  if (etapa === "ja_na_lista") {
    return (
      <div className={`${moldura} text-center`} role="status">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-primary">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#fff" strokeWidth={2.5} aria-hidden>
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mb-3 text-[22px] font-bold leading-tight text-white sm:text-[26px]">
          Você já está na lista VIP
        </h3>
        <p className="mb-6 text-[15px] leading-7 text-white/60">
          Esse CPF já foi cadastrado. Você será avisado pelo WhatsApp assim que as
          vendas abrirem, antes do público geral.
        </p>
        <button
          type="button"
          onClick={() => {
            setEtapa("cpf");
            setCpf("");
          }}
          className="btn-ghost-dark w-full sm:w-auto"
        >
          Cadastrar outro CPF
        </button>
      </div>
    );
  }

  if (etapa === "confirmar" && previa) {
    return (
      <div className={moldura}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
          Membro Somma Club
        </span>
        <h3 className="mb-2 text-[22px] font-bold leading-tight text-white sm:text-[26px]">
          Achamos seu cadastro
        </h3>
        <p className="mb-6 text-[14px] leading-6 text-white/55">
          Confira se é você mesmo. Por segurança, mostramos os dados parcialmente.
        </p>

        <dl className="mb-6 space-y-3 rounded-card border border-white/10 bg-white/[0.04] p-5">
          <LinhaPrevia rotulo="Nome" valor={previa.nome} />
          <LinhaPrevia rotulo="E-mail" valor={previa.email} />
          <LinhaPrevia rotulo="Telefone" valor={previa.telefone} />
        </dl>

        {erroGeral && (
          <p role="alert" className="mb-5 rounded-xl bg-primary/10 px-4 py-3 text-[14px] text-primary">
            {erroGeral}
          </p>
        )}

        <button
          type="button"
          onClick={confirmarMembro}
          disabled={enviando}
          className="btn-primary w-full disabled:opacity-70"
        >
          {enviando ? "Confirmando…" : "Sou eu, entrar na lista VIP"}
          {!enviando && <span aria-hidden>→</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            setEtapa("cpf");
            setPrevia(null);
            setToken("");
            setCpf("");
          }}
          className="mt-3 w-full text-[13px] text-white/45 underline-offset-4 hover:text-white/70 hover:underline"
        >
          Não sou eu, corrigir o CPF
        </button>
      </div>
    );
  }

  if (etapa === "cadastro") {
    return (
      <form onSubmit={enviarCadastro} noValidate className={moldura}>
        <input
          ref={honeypot}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute h-0 w-0 opacity-0"
        />

        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-r2/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-r2">
          Novo por aqui
        </span>
        <h3 className="mb-2 text-[22px] font-bold leading-tight text-white sm:text-[26px]">
          Entre para a comunidade
        </h3>
        <p className="mb-6 text-[14px] leading-6 text-white/55">
          Não encontramos esse CPF na nossa base. Faça seu cadastro no Somma Club,
          sem custo, e entre na lista VIP na mesma hora.
        </p>

        <div className="space-y-5">
          {/* CPF editável aqui: é o único ponto do fluxo em que corrigir um
              dígito errado faz sentido, com o campo à vista. */}
          <Campo
            id="cpf-cadastro"
            label="CPF"
            inputMode="numeric"
            placeholder="000.000.000-00"
            maxLength={14}
            valor={cpf}
            erro={erros.cpf}
            onChange={(v) => {
              setCpf(maskCpf(v));
              if (erros.cpf) setErros((e) => ({ ...e, cpf: undefined }));
            }}
            onBlur={() =>
              setErros((e) => ({
                ...e,
                cpf: isValidCpf(cpf) ? undefined : "Confira o CPF digitado.",
              }))
            }
            disabled={enviando}
          />
          <Campo
            id="nome"
            label="Nome completo"
            placeholder="Maria Silva Santos"
            autoComplete="name"
            maxLength={120}
            valor={cadastro.nome}
            erro={erros.nome}
            onChange={(v) => alterarCadastro("nome", v)}
            onBlur={() => setErros((e) => ({ ...e, nome: validarCampo("nome", cadastro.nome) }))}
            disabled={enviando}
          />
          <Campo
            id="email"
            label="E-mail"
            type="email"
            inputMode="email"
            placeholder="voce@email.com"
            autoComplete="email"
            valor={cadastro.email}
            erro={erros.email}
            onChange={(v) => alterarCadastro("email", v)}
            onBlur={() => setErros((e) => ({ ...e, email: validarCampo("email", cadastro.email) }))}
            disabled={enviando}
          />
          <Campo
            id="telefone"
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            placeholder="(61) 99999-9999"
            autoComplete="tel-national"
            maxLength={15}
            valor={cadastro.telefone}
            erro={erros.telefone}
            onChange={(v) => alterarCadastro("telefone", v)}
            onBlur={() =>
              setErros((e) => ({ ...e, telefone: validarCampo("telefone", cadastro.telefone) }))
            }
            disabled={enviando}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              id="data_nascimento"
              label="Data de nascimento"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              valor={cadastro.data_nascimento}
              erro={erros.data_nascimento}
              onChange={(v) => alterarCadastro("data_nascimento", v)}
              onBlur={() =>
                setErros((e) => ({
                  ...e,
                  data_nascimento: validarCampo("data_nascimento", cadastro.data_nascimento),
                }))
              }
              disabled={enviando}
            />
            <Campo
              id="cep"
              label="CEP"
              inputMode="numeric"
              placeholder="70000-000"
              autoComplete="postal-code"
              maxLength={9}
              valor={cadastro.cep}
              erro={erros.cep}
              onChange={(v) => alterarCadastro("cep", v)}
              onBlur={() => setErros((e) => ({ ...e, cep: validarCampo("cep", cadastro.cep) }))}
              disabled={enviando}
            />
          </div>

          <div>
            <label htmlFor="sexo" className="mb-2 block text-[13px] font-medium text-white/70">
              Sexo
            </label>
            <select
              id="sexo"
              value={cadastro.sexo}
              onChange={(e) => alterarCadastro("sexo", e.target.value)}
              onBlur={() => setErros((e) => ({ ...e, sexo: validarCampo("sexo", cadastro.sexo) }))}
              disabled={enviando}
              aria-invalid={Boolean(erros.sexo)}
              className={`field border-white/12 bg-white/[0.04] text-white focus:border-primary focus:ring-primary/25 disabled:opacity-60 ${
                erros.sexo ? "border-primary/70" : ""
              }`}
            >
              <option value="" className="bg-dark-card">
                Selecione
              </option>
              <option value="feminino" className="bg-dark-card">
                Feminino
              </option>
              <option value="masculino" className="bg-dark-card">
                Masculino
              </option>
              <option value="outro" className="bg-dark-card">
                Outro
              </option>
              <option value="prefiro-nao-dizer" className="bg-dark-card">
                Prefiro não dizer
              </option>
            </select>
            {erros.sexo && <p className="mt-1.5 text-[13px] text-primary">{erros.sexo}</p>}
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
            /* color-scheme dark deixa a caixa desmarcada escura como os campos
               em volta, em vez do branco padrão do navegador. Escopado no
               elemento: no body afetaria barras de rolagem e as seções claras. */
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#FF2C03] [color-scheme:dark]"
          />
          <span className="text-[13px] leading-6 text-white/55">
            Autorizo o tratamento dos meus dados pessoais e o uso da minha imagem nas
            atividades do clube, conforme a LGPD.
          </span>
        </label>

        {erroGeral && (
          <p role="alert" className="mt-5 rounded-xl bg-primary/10 px-4 py-3 text-[14px] text-primary">
            {erroGeral}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn-primary mt-6 w-full disabled:opacity-70">
          {enviando ? "Enviando…" : "Virar membro e entrar na lista"}
          {!enviando && <span aria-hidden>→</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            setEtapa("cpf");
            setErros({});
          }}
          className="mt-3 w-full text-[13px] text-white/45 underline-offset-4 hover:text-white/70 hover:underline"
        >
          Voltar e corrigir o CPF
        </button>
      </form>
    );
  }

  // Etapa 1: CPF
  return (
    <form onSubmit={verificarCpf} noValidate className={moldura}>
      <h3 className="mb-2 text-[22px] font-bold leading-tight text-white sm:text-[26px]">
        Comece pelo seu CPF
      </h3>
      <p className="mb-6 text-[14px] leading-6 text-white/55">
        Usamos o CPF para saber se você já é do Somma Club. Quem é da comunidade tem
        prioridade na compra.
      </p>

      <label htmlFor="cpf" className="mb-2 block text-[13px] font-medium text-white/70">
        CPF
      </label>
      <div className="relative">
        <input
          id="cpf"
          name="cpf"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="go"
          maxLength={14}
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(maskCpf(e.target.value))}
          disabled={enviando}
          aria-describedby="cpf-ajuda"
          className="field border-white/12 bg-white/[0.04] pr-12 text-white placeholder:text-white/25 focus:border-primary focus:ring-primary/25 disabled:opacity-60"
        />
        {enviando && (
          <span
            aria-hidden
            className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-primary"
          />
        )}
      </div>

      <p id="cpf-ajuda" className="mt-2 text-[13px] leading-5 text-white/40" aria-live="polite">
        {enviando ? "Procurando seu cadastro…" : "Assim que completar, buscamos você na base."}
      </p>

      {erroGeral && (
        <p role="alert" className="mt-5 rounded-xl bg-primary/10 px-4 py-3 text-[14px] text-primary">
          {erroGeral}
        </p>
      )}

      {/* O envio acontece sozinho ao completar o CPF; o botão fica como
          alternativa para quem navega por teclado ou colou o número. */}
      <button
        type="submit"
        disabled={enviando || onlyDigits(cpf).length !== 11}
        className="btn-primary mt-6 w-full disabled:opacity-40"
      >
        {enviando ? "Verificando…" : "Continuar"}
        {!enviando && <span aria-hidden>→</span>}
      </button>

      <p className="mt-4 text-center text-[12px] leading-5 text-white/35">
        Seus dados são tratados conforme a LGPD e não são compartilhados com
        terceiros.
      </p>
    </form>
  );
}

/* ─── Peças ──────────────────────────────────────────────────────────────── */

function LinhaPrevia({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 sm:w-20 sm:shrink-0 sm:pt-[5px]">
        {rotulo}
      </dt>
      <dd className="text-[15px] font-medium leading-6 text-white">{valor}</dd>
    </div>
  );
}

function Campo({
  id,
  label,
  valor,
  erro,
  onChange,
  onBlur,
  disabled,
  type = "text",
  inputMode,
  placeholder,
  autoComplete = "off",
  maxLength,
}: {
  id: string;
  label: string;
  valor: string;
  erro?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  type?: string;
  inputMode?: "text" | "email" | "numeric" | "tel";
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-white/70">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`field border-white/12 bg-white/[0.04] text-white placeholder:text-white/25 focus:border-primary focus:ring-primary/25 disabled:opacity-60 ${
          erro ? "border-primary/70" : ""
        }`}
      />
      {erro && (
        <p id={`${id}-erro`} className="mt-1.5 text-[13px] text-primary">
          {erro}
        </p>
      )}
    </div>
  );
}
