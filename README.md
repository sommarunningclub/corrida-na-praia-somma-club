# Corrida na Praia · Somma Club & R2

Landing page da **Corrida na Praia**, collab do Somma Club com a R2 no Na Praia Parque.

**Domingo, 06 de setembro de 2026** · 6 km com largada e chegada dentro do parque · day use até as 17h.

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · GSAP + ScrollTrigger · Lenis · Supabase · Resend · Google Maps.

## Rodar

```bash
npm install
cp .env.local.example .env.local   # preencha as chaves
npm run dev                        # http://localhost:3000
npm run build                      # build de produção
```

> Use `npm run dev` (ou `./node_modules/.bin/next dev`). Um `npx next` pode
> resolver para um Next global de outra versão e falhar com
> "Couldn't find any `pages` or `app` directory".

## Banco

A tabela de leads está em
[`supabase/migrations/0001_napraia_lista_vip.sql`](supabase/migrations/0001_napraia_lista_vip.sql).

Ela roda com **RLS habilitado e sem policies**: a chave anônima nunca a alcança.
Todo insert passa pela API route, que usa a `service_role` no servidor.

Conferindo de ponta a ponta:

```bash
curl -X POST http://localhost:3000/api/lista-vip \
  -H "Content-Type: application/json" \
  -d '{"nome":"Ana Souza","email":"voce@seuemail.com","telefone":"(61) 99988-7766","cpf":"SEU_CPF_VALIDO"}'
# esperado: {"ok":true,"emailEnviado":true}
```

## Arquitetura

```
app/
  layout.tsx            metadata, JSON-LD do evento, Geist, smooth scroll
  page.tsx              composição das seções
  globals.css           design system (tokens Somma + comportamento iOS)
  api/lista-vip/        POST: valida → grava no Supabase → dispara o e-mail
components/
  hero                  chamada, countdown e ondas do parallax
  sorteio               faixa da ação promocional (ingresso do show)
  sobre                 o evento + informações principais
  percurso              circuito de 6 km + mapa do Google
  inclui                uma inscrição/duas experiências + o que vem no ingresso
  cronograma            linha do tempo do domingo
  espaco                fotos do Na Praia Parque
  extras                premiação e experiências adicionais
  comunidades · faq · inscricao · footer
  navbar · cta-bar      navegação e barra de ação fixa (padrão iOS)
  countdown             contagem regressiva até o dia do evento
  mapa                  Google Maps com estilo monocromático e pin laranja
  lista-vip-form        formulário (nome, e-mail, telefone, CPF)
  ui/reveal             entrada por scroll com GSAP
  ui/sunburst           selo Na Praia girando
  ui/wordmark           lockup Somma + R2
lib/
  napraia-data.ts       fonte única de conteúdo — edite aqui, não nos componentes
  validation.ts         schema zod + máscaras + validação de CPF
  supabase.ts           client service_role (server-only)
  emails/vip-email.ts   template e envio via Resend
  gsap.ts               registro do ScrollTrigger + prefers-reduced-motion
supabase/migrations/    SQL da tabela de leads
```

### Onde mexer no conteúdo

Praticamente tudo (data, local, percurso, preços, cronograma, FAQ, links, fotos)
vive em `lib/napraia-data.ts`. Mudou a data? Altere `EVENTO.dataISO` e o countdown,
o JSON-LD e todos os textos acompanham.

Os horários de abertura de portões e largada **ainda não foram confirmados** pela
organização — o cronograma é apresentado em etapas, sem horas, com aviso explícito
em `CRONOGRAMA_NOTA`.

## Design system

| Token | Valor |
| --- | --- |
| Primária | `#FF2C03` (hover `#FB4C00`) |
| Navy da collab | `#010775` · fundo profundo `#01053F` |
| Amarelo R2 | `#FCAD00` |
| Creme | `#FEF5E6` |
| Tinta / cards escuros | `#0A0A0A` · `#0E0E0E` |
| Fonte | Geist (self-hosted via pacote `geist`) |
| Botões | pill `border-radius: 9999px`, altura mínima 48px |
| Cards | 16px (conteúdo) · 24px (painéis) |
| Ritmo de seção | 112px (desktop), reduzido no mobile |

Seções alternam claro/escuro para criar ritmo, como no site principal do Somma.
Copy sem travessões, por decisão do cliente.

## Comportamento iOS

- `100dvh` com fallback em `vh` — a barra do Safari não faz a página pular.
- `env(safe-area-inset-*)` no header, na barra de CTA e no rodapé.
- Inputs em 16px: abaixo disso o iOS dá zoom automático no foco.
- `-webkit-tap-highlight-color: transparent` + `active:scale` — feedback tátil próprio.
- Lenis com `syncTouch: false`: o momentum nativo do iOS é preservado; o easing fica só no desktop.
- Carrossel do espaço com scroll-snap horizontal.
- Alvos de toque com no mínimo 44–48px.
- `prefers-reduced-motion` desliga GSAP, Lenis e o smooth scroll.

## Notas

- O formulário valida CPF pelos dígitos verificadores (client e server).
- E-mail e CPF são únicos: cadastro repetido devolve 409 "Você já está na lista VIP!".
- Campo `website` é honeypot: preenchido, a API responde `200` silencioso, sem gravar
  e sem revelar qual campo denunciou o bot.
- Falha no envio do e-mail **não** derruba o cadastro — o lead é gravado primeiro e a
  resposta traz `emailEnviado: false`.
- UTMs da URL (`utm_source`, `utm_medium`, `utm_campaign`) são gravadas junto com o lead.
- Sem JavaScript, o `<noscript>` do layout devolve a opacidade de tudo que o GSAP animaria.
- A chave do Google Maps é compartilhada com outros projetos Somma; para produção,
  restrinja por referrer HTTP no Google Cloud Console.
- Os originais `.HEIC` das fotos do parque não são versionados (~50 MB); as versões
  `.jpg` usadas pelo site estão no repositório.
