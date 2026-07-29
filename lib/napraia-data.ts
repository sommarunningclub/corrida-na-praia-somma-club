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
    // Convite do grupo da comunidade, mostrado a quem acabou de virar membro.
    // Deixe vazio para cair no WhatsApp de atendimento.
    grupo: "",
  },
} as const;

export const R2 = {
  nome: "R2",
  site: "https://r2.com.vc",
  logo: "/logo-r2.svg",
} as const;

/* ─── Agenda do evento ───────────────────────────────────────────────────── */
// A Corrida na Praia já existe como evento na Agenda Somma Club, que é a fonte
// de verdade de data, horário e local. Não duplicamos esses dados aqui: os
// botões apontam para o endpoint da agenda, que monta o .ics e os deeplinks a
// partir do evento publicado. Se a organização mudar o horário lá, muda aqui.
const AGENDA_ORIGEM = "https://agenda.sommaclub.com.br";
const AGENDA_EVENTO_SLUG = "corrida-na-praia-com-a-somma-club";
const AGENDA_ICS = `${AGENDA_ORIGEM}/api/calendar/evento/${AGENDA_EVENTO_SLUG}.ics`;

export const AGENDA = {
  eyebrow: "SALVE A DATA",
  titulo: "Coloque a corrida na sua agenda",
  descricao:
    "Adicione a Corrida na Praia ao calendário do seu celular e receba lembretes antes da largada.",
  descricaoCurta: "Receba lembretes antes da largada.",
  pagina: `${AGENDA_ORIGEM}/agenda/${AGENDA_EVENTO_SLUG}`,
  // Assinatura da agenda completa do Somma Club, para quem quer todos os eventos.
  feed: `${AGENDA_ORIGEM}/agenda`,
  apps: [
    // `curto` é o rótulo da versão compacta do hero: com o nome completo os
    // três botões não cabem em uma linha no mobile.
    {
      key: "google",
      label: "Google Agenda",
      curto: "Google",
      hint: "Android e web",
      href: `${AGENDA_ICS}?app=google`,
      novaAba: true,
    },
    {
      key: "apple",
      label: "Apple Calendar",
      curto: "Apple",
      hint: "iPhone, iPad e Mac",
      href: AGENDA_ICS,
      novaAba: false,
    },
    {
      key: "outlook",
      label: "Outlook",
      curto: "Outlook",
      hint: "Microsoft",
      href: `${AGENDA_ICS}?app=outlook`,
      novaAba: true,
    },
  ],
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
  // Show: sábado 01/08. Sorteio: sexta 31/07. Manter essa distinção visível na UI.
  showDia: "Sábado, 1º de agosto",
  data: "1º de agosto de 2026",
  hora: "18h",
  local: "Na Praia Parque, Brasília",
  sorteioDia: "Sexta-feira, 31 de julho",
  quando: "Sorteio nesta sexta-feira, 31 de julho",
  regra: "A participação está sujeita ao regulamento oficial da ação promocional.",
  poster: "/sorteio-nattan-matheus-kauan-bia.png",
  url: "https://r2.com.vc/produto/01-08-nattan-matheus-e-kauan-bia-frazzo/",
} as const;

/* ─── Lista VIP ──────────────────────────────────────────────────────────── */
// Os valores da pré-venda ainda não são públicos: a lista VIP existe para
// medir intenção antes da abertura. Não colocar preço aqui.

// Encerramento das inscrições na lista VIP: 1º de agosto de 2026, no fim do dia.
export const LISTA_VIP_PRAZO = "2026-08-01T23:59:59-03:00";

export const PRIORIDADE = {
  eyebrow: "COMO VAI FUNCIONAR A VENDA",
  titulo: "A comunidade Somma compra primeiro, e com desconto",
  descricao:
    "A venda dos ingressos acontece em duas etapas. Quem é do Somma Club tem prioridade, compra antes de todo mundo e paga menos. Depois, o que sobrar vai para o público geral, pelo valor cheio.",
  // O desconto é o argumento mais forte da lista VIP. Aparece como selo nos
  // dois lugares em que a decisão acontece: aqui e no bloco de cadastro.
  // O valor em si só sai na abertura das vendas, por decisão do cliente.
  selo: "Preço com desconto",
  reforcoDesconto:
    "Quem está na lista VIP compra na pré-venda, com valor menor que o da venda geral. O desconto vale enquanto durar a etapa da comunidade.",
  etapas: [
    {
      ordem: "01",
      titulo: "Comunidade Somma Club",
      descricao:
        "Quem já é membro do Somma Club e entrou na lista VIP recebe o aviso primeiro e compra antes da abertura geral com desconto.",
      destaque: true,
    },
    {
      ordem: "02",
      titulo: "Público geral",
      descricao:
        "Depois do prazo da comunidade, as vagas restantes são abertas para todo mundo pelo valor cheio, enquanto durarem.",
      destaque: false,
    },
  ],
  aviso:
    "Prioridade não é reserva: as vagas são limitadas e podem acabar ainda na etapa da comunidade.",
  chamadaNaoMembro:
    "Ainda não é do Somma Club? Dá tempo. Faça seu cadastro na lista VIP e entre para a comunidade agora, sem custo.",
} as const;

export const LISTA_VIP = {
  eyebrow: "LISTA VIP",
  titulo: "Quem entra primeiro, corre na frente",
  descricao:
    "As vagas da Corrida na Praia são limitadas e a comunidade Somma Club compra primeiro, com desconto. Entre na lista VIP para receber o aviso de abertura antes do público geral.",
  prazoTitulo: "As inscrições na lista VIP terminam em",
  prazoEncerrado: "As inscrições na lista VIP foram encerradas.",
  // O e-mail de confirmação volta a sair no ato do cadastro
  // (VIP_EMAIL_ENABLED). O aviso de abertura das vendas sai pelos dois
  // canais, com o telefone e o e-mail informados aqui.
  vantagens: [
    "Preço com desconto na pré-venda",
    "Acesso antecipado à abertura das vendas",
    "Aviso por e-mail e WhatsApp antes da venda geral",
    "Concorre a um ingresso para o show",
  ],
  destaques: [
    { valor: "Vagas", label: "limitadas" },
    { valor: "1º", label: "a saber da abertura" },
  ],
  aviso:
    "O cadastro na lista VIP não representa reserva, compra automática ou garantia de disponibilidade do ingresso. Os valores serão divulgados na abertura das vendas.",
} as const;

/* ─── O evento ───────────────────────────────────────────────────────────── */

export const SOBRE = {
  eyebrow: "O EVENTO",
  titulo: "Corrida, música e day use no mesmo domingo.",
  paragrafos: [
    "No dia 6 de setembro de 2026, o Na Praia Parque recebe uma experiência que une corrida, saúde, música, bem-estar, comunidade e diversão.",
    "A Corrida na Praia será muito mais do que uma prova. Os participantes viverão uma programação completa antes, durante e depois dos 6 km, com acesso exclusivo ao parque até às 17h.",
  ],
  resumo:
    "Uma corrida de 6 km com largada e chegada dentro do Na Praia Parque, kit completo, medalha, café da manhã, música, experiências de wellness, cortesia para acompanhante e acesso exclusivo ao day use até às 17h. A corrida termina, mas o Dia Na Praia continua.",
} as const;

export const INFO_PRINCIPAIS = [
  { label: "Data", valor: "6 de setembro de 2026" },
  { label: "Local", valor: "Na Praia Parque, Brasília" },
  { label: "Distância", valor: "6 km" },
  { label: "Formato", valor: "Largada e chegada dentro do parque" },
  { label: "Day use", valor: "Até às 17h" },
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
    { ordem: "01", titulo: "Largada no parque", descricao: "A prova começa dentro do Na Praia Parque." },
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
    "A inscrição garante a participação do atleta na Corrida na Praia e também o acesso ao Dia Na Praia, com programação exclusiva até às 17h.",
    "Além disso, cada corredor recebe um ingresso de cortesia para levar um acompanhante ao evento.",
  ],
  // O limite da cortesia precisa ficar explícito: é o ponto que mais gera
  // dúvida e reclamação no dia do evento.
  cortesiaTitulo: "O que a cortesia dá, e o que não dá",
  cortesiaInclui: [
    "Entrada do acompanhante no Na Praia Parque",
    "Acesso ao Dia Na Praia e à programação até às 17h",
    "Crianças até 10 anos não pagam",
  ],
  cortesiaNaoInclui: [
    "Kit oficial da corrida",
    "Participação na prova",
    "Medalha e premiação",
  ],
  nota:
    "A cortesia permite que o acompanhante aproveite o Dia Na Praia enquanto o participante corre. Ela não é uma segunda inscrição: para correr, é necessário ter inscrição própria. Crianças até 10 anos não pagam.",
} as const;

export const INCLUI = [
  "Participação na corrida de 6 km",
  "Kit oficial da prova, com camiseta LIVE!, boné, meia, medalha e outros itens de parceiros",
  "Medalha de participação após a conclusão da prova",
  "Café da manhã",
  "Smoothies e experiências de parceiros",
  "Aulão de alongamento e aquecimento antes da largada, com participação da Smart Fit",
  "Recovery e welcome drink no pós-prova",
  "Acesso à programação esportiva do Dia Na Praia",
  "Música e entretenimento durante o evento",
  "Day use exclusivo no Na Praia Parque até às 17h",
  "After dentro do parque, depois da corrida",
  "Uma cortesia para acompanhante",
  "Crianças até 10 anos não pagam",
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
    descricao: "Os corredores são organizados na largada e o percurso de 6 km começa.",
    destaque: true,
  },
  {
    titulo: "Chegada, medalhas e recovery",
    descricao:
      "Medalha de participação, premiação dos primeiros colocados, recovery e welcome drink no pós-prova.",
    destaque: false,
  },
  {
    titulo: "Dia Na Praia",
    descricao:
      "Música, experiências de wellness, alimentação, ativações de marcas e day use no parque.",
    destaque: false,
  },
  {
    titulo: "After no parque",
    descricao: "O after exclusivo dentro do Na Praia, com day use válido até às 17h.",
    destaque: true,
  },
] as const;

export const CRONOGRAMA_NOTA =
  "Os horários de abertura dos portões e da largada ainda serão confirmados pela organização.";

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
  descricao:
    "Recovery e welcome drink no pós-prova já estão no ingresso. Durante a inscrição, o participante poderá adicionar experiências complementares.",
  itens: [
    {
      titulo: "Área Recovery premium",
      descricao: "Banheira de gelo e massagem para recuperação avançada após a prova.",
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
    "A proposta é transformar o evento em um grande encontro entre pessoas que compartilham esporte, saúde, movimento e conexão. O Somma Club estará presente como uma das comunidades parceiras da experiência.",
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
    a: "O acesso ao Dia Na Praia é válido até às 17h.",
  },
  {
    q: "Criança paga ingresso?",
    a: "Crianças até 10 anos não pagam. A regra vale para o acesso ao Dia Na Praia vinculado à cortesia ou à inscrição do responsável.",
  },
  {
    q: "O acompanhante também pode correr?",
    a: "Não. A cortesia garante apenas o acesso do acompanhante ao evento. Para participar da corrida, é necessário ter inscrição própria.",
  },
  {
    q: "A cortesia dá direito ao kit da corrida?",
    a: "Não. O kit oficial é exclusivo de quem está inscrito na prova. A cortesia dá ao acompanhante a entrada no Na Praia Parque e o acesso ao Dia Na Praia até às 17h, mas não dá direito ao kit, à medalha nem à premiação.",
  },
  {
    q: "O que está incluído no ingresso?",
    a: "A corrida, o kit oficial, medalha, café da manhã, smoothies, aquecimento, recovery e welcome drink no pós-prova, experiências de parceiros, acesso à programação esportiva, after, day use e uma cortesia para acompanhante. Crianças até 10 anos não pagam.",
  },
  {
    q: "O parque estará aberto ao público geral?",
    a: "Não. Nesse dia, o Na Praia estará reservado aos participantes da corrida, aos acompanhantes e às pessoas credenciadas para o evento.",
  },
  {
    q: "Haverá premiação?",
    a: "Sim. Serão premiados os três primeiros colocados masculinos e os três primeiros colocados femininos.",
  },
  {
    q: "Recovery e welcome drink estão incluídos?",
    a: "Sim. Recovery e welcome drink no pós-prova fazem parte do ingresso. Já a Área Recovery premium, com banheira de gelo e massagem, a personalização da medalha e o lounge open bar são experiências adicionais, adquiridas separadamente.",
  },
  {
    q: "Entrar na lista VIP garante o ingresso?",
    a: "Não. A lista VIP dá acesso antecipado à abertura das vendas, mas os ingressos continuam sujeitos à disponibilidade. As vagas são limitadas.",
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
