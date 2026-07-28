import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { EVENTO, SOMMA } from "@/lib/napraia-data";

const TITLE = "Corrida na Praia · Somma Club & R2 · 06.09.2026";
const DESCRIPTION =
  "Corrida de 6 km com largada e chegada dentro do Na Praia Parque, em Brasília. Kit oficial, medalha, café da manhã, música e day use até as 17h. Entre na lista VIP e garanta acesso antecipado à pré-venda.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Corrida na Praia",
  keywords: [
    "Corrida na Praia",
    "Somma Club",
    "Na Praia Parque",
    "corrida Brasília",
    "corrida 6km DF",
    "running club Brasília",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Corrida na Praia",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
  // PWA-ish no iOS: abre em tela cheia quando salvo na home.
  appleWebApp: { capable: true, title: "Corrida na Praia", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#01053F",
  width: "device-width",
  initialScale: 1,
  // Zoom liberado: travar em maximumScale=1 quebra acessibilidade no iOS.
  viewportFit: "cover",
};

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: EVENTO.nome,
  description: DESCRIPTION,
  startDate: EVENTO.dataISO,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: EVENTO.local.nome,
    address: {
      "@type": "PostalAddress",
      streetAddress: EVENTO.local.endereco,
      addressLocality: "Brasília",
      addressRegion: "DF",
      postalCode: EVENTO.local.cep,
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: EVENTO.local.geo.lat,
      longitude: EVENTO.local.geo.lng,
    },
  },
  organizer: { "@type": "Organization", name: SOMMA.nome, url: SOMMA.links.site },
  // Sem preço: os valores só serão divulgados na abertura das vendas.
  offers: {
    "@type": "Offer",
    priceCurrency: "BRL",
    availability: "https://schema.org/PreOrder",
    description:
      "Vagas limitadas. Cadastrados na lista VIP recebem o aviso de abertura das vendas antes do público geral.",
  },
  isAccessibleForFree: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={GeistSans.variable}>
      <body>
        <SmoothScroll />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
        {/* Sem JS, nada fica invisível esperando o GSAP. */}
        <noscript>
          <style>{`.gsap-hidden{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
