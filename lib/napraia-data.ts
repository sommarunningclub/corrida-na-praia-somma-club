// Fonte única de conteúdo da landing da Corrida na Praia.
// Dados do evento confirmados pelo cliente. Não inventar informação aqui.
// Copy sem travessões, por decisão do cliente.

export const EVENTO = {
  nome: "Corrida na Praia",
  collab: "Somma Club & R2",
  chamada: "Somma Club & R2 te levam pro Na Praia Festival",
  subchamada: "Seu melhor tempo vai ser aqui",
  // 06/09/2026 é domingo. O horário da largada ainda não foi confirmado
  // pela organização, então o countdown mira o início do dia.
  dataISO: "2026-09-06T06:00:00-03:00",
  diaSemana: "Domingo",
  dia: "06",
  mes: "Setembro",
  ano: "2026",
  dataExtenso: "Domingo, 06 de setembro de 2026",
  dataCurta: "06 de setembro",
  distancia: "6 km",
  horaLargada: "a confirmar",
  dayUseAte: "17h",
  local: {
    nome: "Na Praia Parque",
    endereco: "St. de Clubes Esportivos Sul, Trecho 2",
    bairro: "Asa Sul, Brasília, DF",
    cep: "70297-400",
    // Coordenadas confirmadas via Google Geocoding API.
    geo: { lat: -15.818088, lng: -47.8499962 },
    maps: "https://www.google.com/maps/search/?api=1&query=-15.818088,-47.8499962",
  },
} as const;

export const SOMMA = {
  nome: "Somma Club",
  slogan: "Se é pra correr, que seja com vibe boa.",
  cnpj: "61.315.987/0001-28",
  logo: "/logo-somma.svg",
  links: {
    strava:
      "https://www.strava.com/clubs/1608501?share_sig=D8C84ECD1759146345&_branch_match_id=1315308772546708809&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXLy4pSixL1EcsKNDLzczL1jcxdsmPCgmrNA5Psq8rSk1LLSrKzEuPTyrKLy9OLbJ1zijKz00FAFnkwLM9AAAA",
    instagram: "https://instagram.com/somma.club",
    tiktok: "https://www.tiktok.com/@somma.club",
    whatsapp: "https://wa.me/5561995372477",
    site: "https://sommaclub.com.br",
    email: "contato@sommaclub.com.br",
    telefone: "+55 (61) 99537-2477",
  },
} as const;

export const R2 = {
  nome: "R2",
  site: "https://r2.com.vc",
  logo: "/logo-r2.svg",
} as const;

export const NAV = [
  { label: "O evento", href: "#evento" },
  { label: "Percurso", href: "#percurso" },
  { label: "Inclui", href: "#inclui" },
  { label: "O dia", href: "#cronograma" },
  { label: "O espaço", href: "#espaco" },
  { label: "FAQ", href: "#faq" },
] as const;

export const STATS = [
  { value: "6 km", label: "Percurso único" },
  { value: "17h", label: "Day use até" },
  { value: "+1", label: "Cortesia acompanhante" },
  { value: "06.09", label: "Domingo" },
] as const;

/* ─── Ação promocional da lista VIP ──────────────────────────────────────── */

export const SORTEIO = {
  eyebrow: "AÇÃO ESPECIAL DA LISTA VIP",
  titulo: "Cadastre-se e concorra a um ingresso para o show",
  atracoes: "Nattan + Matheus & Kauan + Bia Frazzo",
  data: "1º de agosto de 2026",
  hora: "18h",
  local: "Na Praia Parque, Brasília",
  regra: "A participação está sujeita ao regulamento oficial da ação promocional.",
} as const;

/* ─── Pré-venda ──────────────────────────────────────────────────────────── */

export const PRECOS = {
  eyebrow: "LISTA VIP E PRÉ-VENDA",
  titulo: "Quem entra primeiro, corre na frente",
  descricao:
    "Os cadastrados na lista VIP terão acesso antecipado à pré-venda da Corrida na Praia. O link será enviado por WhatsApp e e-mail.",
  preVenda: "R$ 170,00",
  preVendaDuracao: "Duração prevista de 7 dias",
  vendaGeral: "a partir de R$ 180,00",
  aviso:
    "O cadastro na lista VIP não representa reserva, compra automática ou garantia de disponibilidade do ingresso.",
} as const;

/* ─── O evento ───────────────────────────────────────────────────────────── */

export const SOBRE = {
  eyebrow: "O EVENTO",
  titulo: "Corrida, música e day use no mesmo domingo.",
  paragrafos: [
    "No dia 6 de setembro de 2026, o Na Praia Parque recebe uma experiência que une corrida, saúde, música, bem-estar, comunidade e diversão.",
    "A Corrida na Praia será muito mais do que uma prova. Os participantes viverão uma programação completa antes, durante e depois dos 6 km, com acesso exclusivo ao parque até as 17h.",
  ],
  resumo:
    "Uma corrida de 6 km com largada e chegada dentro do Na Praia Parque, kit completo, medalha, café da manhã, música, experiências de wellness, acompanhante e acesso exclusivo ao day use até as 17h. A corrida termina, mas o Dia Na Praia continua.",
} as const;

export const INFO_PRINCIPAIS = [
  { label: "Data", valor: "6 de setembro de 2026" },
  { label: "Local", valor: "Na Praia Parque, Brasília" },
  { label: "Distância", valor: "6 km" },
  { label: "Formato", valor: "Largada e chegada dentro do parque" },
  { label: "Day use", valor: "Até as 17h" },
  { label: "Público", valor: "Corredores, clubes, assessorias, comunidades e acompanhantes credenciados" },
] as const;

/* ─── Percurso ───────────────────────────────────────────────────────────── */

export const PERCURSO = {
  eyebrow: "O PERCURSO",
  titulo: "Um circuito único de 6 km",
  paragrafos: [
    "A prova terá um circuito único de 6 km, com largada e chegada dentro do Na Praia Parque.",
    "O trajeto seguirá pelo SCES Trecho 2, subirá pela Estrada Parque das Nações e retornará pelo SCES Trecho 3, completando o circuito no Setor de Clubes Esportivos Sul.",
    "Ao longo do percurso, os corredores encontrarão música e ativações que levarão o clima do Na Praia do primeiro ao último quilômetro.",
  ],
  trechos: [
    { ordem: "01", titulo: "Largada no parque", descricao: "Saída de dentro do Na Praia Parque." },
    { ordem: "02", titulo: "SCES Trecho 2", descricao: "Primeiro trecho pelo Setor de Clubes Esportivos Sul." },
    { ordem: "03", titulo: "Estrada Parque das Nações", descricao: "Subida pela Estrada Parque das Nações." },
    { ordem: "04", titulo: "SCES Trecho 3", descricao: "Retorno fechando o circuito." },
    { ordem: "05", titulo: "Chegada no parque", descricao: "Linha de chegada dentro do Na Praia." },
  ],
} as const;

/* ─── Uma inscrição, duas experiências ───────────────────────────────────── */

export const DUAS_EXPERIENCIAS = {
  eyebrow: "UMA INSCRIÇÃO, DUAS EXPERIÊNCIAS",
  titulo: "Você corre. E o dia continua.",
  paragrafos: [
    "A inscrição garante a participação do atleta na Corrida na Praia e também o acesso ao Dia Na Praia, com programação exclusiva até as 17h.",
    "Além disso, cada corredor receberá um ingresso de cortesia para levar um acompanhante ao evento.",
  ],
  nota:
    "A cortesia permite que o acompanhante aproveite o Dia Na Praia enquanto o participante corre. Ela não representa uma segunda inscrição para a prova.",
} as const;

export const INCLUI = [
  "Participação na corrida de 6 km",
  "Kit oficial da prova, com camiseta LIVE!, boné, meia, medalha e outros itens de parceiros",
  "Medalha de participação após a conclusão da prova",
  "Café da manhã",
  "Smoothies e experiências de parceiros",
  "Aulão de alongamento e aquecimento antes da largada, com participação da Smart Fit",
  "Acesso à programação esportiva do Dia Na Praia",
  "Música e entretenimento durante o evento",
  "Day use exclusivo no Na Praia Parque até as 17h",
  "After dentro do parque após a corrida",
  "Uma cortesia para acompanhante",
] as const;

/* ─── O dia do evento ────────────────────────────────────────────────────── */

export const CRONOGRAMA = [
  {
    titulo: "Chegada e encontro das comunidades",
    descricao: "Chegada dos corredores, café da manhã e ativações dos parceiros.",
    destaque: false,
  },
  {
    titulo: "Aulão de alongamento e aquecimento",
    descricao: "No palco principal, com participação da Smart Fit, antes da largada.",
    destaque: false,
  },
  {
    titulo: "Largada",
    descricao: "Corredores direcionados para a organização da prova e início do percurso de 6 km.",
    destaque: true,
  },
  {
    titulo: "Chegada e entrega de medalhas",
    descricao: "Medalha de participação e premiação dos primeiros colocados.",
    destaque: false,
  },
  {
    titulo: "Dia Na Praia",
    descricao: "Música, experiências de wellness, alimentação e ativações de marcas.",
    destaque: false,
  },
  {
    titulo: "After no parque",
    descricao: "O after exclusivo dentro do Na Praia, com day use válido até as 17h.",
    destaque: true,
  },
] as const;

export const CRONOGRAMA_NOTA =
  "O horário de abertura dos portões e da largada ainda será confirmado pela organização.";

/* ─── Premiação e experiências adicionais ────────────────────────────────── */

export const PREMIACAO = {
  eyebrow: "PREMIAÇÃO",
  titulo: "Pódio geral masculino e feminino",
  itens: ["1º, 2º e 3º lugares masculinos", "1º, 2º e 3º lugares femininos"],
  nota: "Os detalhes sobre os itens entregues na premiação serão divulgados pela organização.",
} as const;

export const ADICIONAIS = {
  eyebrow: "EXPERIÊNCIAS ADICIONAIS",
  titulo: "Dá para ir além do ingresso",
  descricao: "Durante a inscrição, o participante poderá adicionar experiências complementares.",
  itens: [
    {
      titulo: "Área Recovery",
      descricao: "Banheira de gelo e massagem para recuperação após a prova.",
    },
    {
      titulo: "Personalização da medalha",
      descricao: "Inclusão de nome, pace e tempo do corredor.",
    },
    {
      titulo: "Lounge open bar",
      descricao: "Acesso a uma área especial com serviço de bebidas.",
    },
  ],
  nota:
    "Essas experiências não fazem parte do ingresso padrão e deverão ser adquiridas separadamente.",
} as const;

/* ─── Clubes e comunidades ───────────────────────────────────────────────── */

export const COMUNIDADES = {
  eyebrow: "CLUBES E COMUNIDADES",
  titulo: "Um grande encontro da corrida de Brasília",
  paragrafos: [
    "A Corrida na Praia reunirá diferentes clubes, assessorias e comunidades de corrida de Brasília.",
    "A proposta é transformar o evento em um grande encontro entre pessoas que compartilham esporte, saúde, movimento e conexão. A Somma Club estará presente como uma das comunidades parceiras da experiência.",
  ],
} as const;

/* ─── FAQ ────────────────────────────────────────────────────────────────── */

export const FAQ = [
  {
    q: "Qual é a distância da corrida?",
    a: "A Corrida na Praia terá um percurso único de 6 km, com largada e chegada dentro do Na Praia Parque.",
  },
  {
    q: "Até que horas vai o day use?",
    a: "O acesso ao Dia Na Praia será válido até as 17h.",
  },
  {
    q: "O acompanhante também pode correr?",
    a: "Não. A cortesia garante o acesso do acompanhante ao evento. Para participar da corrida, é necessário possuir uma inscrição própria.",
  },
  {
    q: "O que está incluído no ingresso?",
    a: "A corrida, o kit oficial, medalha, café da manhã, smoothies, aquecimento, experiências de parceiros, acesso à programação esportiva, after, day use e uma cortesia para acompanhante.",
  },
  {
    q: "O parque estará aberto ao público geral?",
    a: "Nesse dia, o Na Praia estará reservado para os participantes da corrida, acompanhantes e pessoas credenciadas para o evento.",
  },
  {
    q: "Haverá premiação?",
    a: "Sim. Serão premiados os três primeiros colocados masculinos e os três primeiros colocados femininos.",
  },
  {
    q: "A Área Recovery está incluída?",
    a: "Não. A Área Recovery, a personalização da medalha e o lounge open bar são experiências adicionais que poderão ser adquiridas durante a inscrição.",
  },
  {
    q: "Entrar na lista VIP garante o ingresso?",
    a: "Não. A lista VIP dá acesso antecipado à pré-venda, mas os ingressos continuarão sujeitos à disponibilidade.",
  },
] as const;

// Fotos do espaço do Na Praia (convertidas de HEIC para JPEG).
const NP = "/napraia";
export const ESPACO = {
  destaque: {
    src: `${NP}/IMG_6593.jpg`,
    alt: "Areia, tendas coral e cadeiras de praia do Na Praia com o Lago Paranoá ao fundo",
  },
  fotos: [
    { src: `${NP}/IMG_6570.jpg`, alt: "Tendas de sombra com mesas de madeira na areia do Na Praia" },
    { src: `${NP}/IMG_6599.jpg`, alt: "Entrada do Na Praia entre palmeiras, com o quiosque ao fundo" },
    { src: `${NP}/IMG_6562.jpg`, alt: "Palco em formato de lata no espaço aberto do Na Praia" },
    { src: `${NP}/IMG_6596.jpg`, alt: "Área de convivência do Na Praia com palmeiras e mesas na sombra" },
    { src: `${NP}/IMG_6592.jpg`, alt: "Kombi decorada e guarda-sol na entrada da área de areia" },
    { src: `${NP}/IMG_6598.jpg`, alt: "Vista ampla das tendas e do gramado do Na Praia" },
    { src: `${NP}/IMG_6566.jpg`, alt: "Fachada azul do Na Praia entre palmeiras" },
    { src: `${NP}/IMG_6595.jpg`, alt: "Espaço do Na Praia à beira do Lago Paranoá" },
  ],
} as const;
