"use client";

import { useEffect, useState } from "react";

/**
 * Regras compartilhadas pelos elementos flutuantes do rodapé: a CtaBar da
 * lista VIP e o botão de agenda.
 */

/**
 * Aparecem depois do hero e somem quando a seção de inscrição entra em cena,
 * para não competir com o CTA da própria seção.
 *
 * Os dois usam a mesma regra de propósito. No mobile um fica logo acima do
 * outro, então bastaria alguém mexer em um dos limiares para eles se
 * sobreporem. Com uma regra só, ou os dois estão na tela, ou nenhum está.
 */
export function useMostrarFlutuante(): boolean {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const form = document.getElementById("inscricao");
      const passouHero = window.scrollY > window.innerHeight * 0.85;
      const formVisivel = form
        ? form.getBoundingClientRect().top < window.innerHeight * 0.9
        : false;
      setMostrar(passouHero && !formVisivel);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return mostrar;
}

/** Evento que a Navbar dispara ao abrir e fechar o menu mobile. */
export const EVENTO_MENU = "somma:menu";

/**
 * Com o menu mobile aberto, o overlay escuro fica em z-30 e os flutuantes do
 * rodapé continuariam boiando por cima dele. Quem escuta isso se esconde.
 */
export function useMenuAberto(): boolean {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const onMenu = (e: Event) => {
      setAberto(Boolean((e as CustomEvent<{ aberto: boolean }>).detail?.aberto));
    };
    window.addEventListener(EVENTO_MENU, onMenu);
    return () => window.removeEventListener(EVENTO_MENU, onMenu);
  }, []);

  return aberto;
}
