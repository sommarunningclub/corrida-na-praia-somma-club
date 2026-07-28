import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Sorteio } from "@/components/sorteio";
import { Sobre } from "@/components/sobre";
import { Percurso } from "@/components/percurso";
import { Inclui } from "@/components/inclui";
import { Prioridade } from "@/components/prioridade";
import { Cronograma } from "@/components/cronograma";
import { Espaco } from "@/components/espaco";
import { Extras } from "@/components/extras";
import { Comunidades } from "@/components/comunidades";
import { Faq } from "@/components/faq";
import { Inscricao } from "@/components/inscricao";
import { Footer } from "@/components/footer";
import { CtaBar } from "@/components/cta-bar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Sorteio />
        <Sobre />
        <Percurso />
        <Inclui />
        <Prioridade />
        <Cronograma />
        <Espaco />
        <Extras />
        <Comunidades />
        <Faq />
        <Inscricao />
      </main>
      <Footer />
      <CtaBar />
    </>
  );
}
