"use client";

import { useEffect, useState } from "react";
import { NAV } from "@/lib/napraia-data";
import { EVENTO_MENU } from "@/lib/flutuantes";
import { Wordmark } from "@/components/ui/wordmark";

export function Navbar() {
  const [aberto, setAberto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trava o scroll do body com o menu aberto (sem pular a posição no iOS).
  useEffect(() => {
    if (!aberto) return;
    const y = window.scrollY;
    const { body } = document;
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      window.scrollTo(0, y);
    };
  }, [aberto]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Os flutuantes do rodapé precisam saber: o overlay do menu é z-30 e eles
  // ficariam boiando por cima do escurecido.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(EVENTO_MENU, { detail: { aberto } }));
  }, [aberto]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 safe-top transition-shadow duration-300 ${
          scrolled || aberto ? "glass-dark shadow-lg shadow-black/20" : "bg-transparent"
        }`}
      >
        <nav
          className="container-somma flex h-16 items-center justify-between"
          aria-label="Navegação principal"
        >
          {/* -my-3 py-3: área de toque de 44px sem alterar a altura do header. */}
          <a href="#topo" aria-label="Somma Club e R2 no Na Praia" className="-my-3 flex py-3">
            <Wordmark />
          </a>

          <ul className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="flex items-center py-3.5 text-sm text-white/70 transition-colors duration-200 hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a href="#inscricao" className="btn-primary hidden h-11 min-h-0 px-6 text-sm sm:inline-flex">
              Entrar na lista VIP
            </a>

            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              aria-controls="menu-mobile"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-white active:scale-95 lg:hidden"
            >
              <span className="relative block h-4 w-5">
                <span
                  className={`absolute left-0 block h-[2px] w-5 rounded-full bg-current transition-transform duration-300 ${
                    aberto ? "top-[7px] rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] block h-[2px] w-5 rounded-full bg-current transition-opacity duration-200 ${
                    aberto ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[2px] w-5 rounded-full bg-current transition-transform duration-300 ${
                    aberto ? "top-[7px] -rotate-45" : "top-[14px]"
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Painel mobile — sheet que desce por baixo do header. */}
      <div
        id="menu-mobile"
        className={`fixed inset-x-0 top-0 z-40 lg:hidden ${aberto ? "" : "pointer-events-none"}`}
      >
        <div
          className={`glass-dark safe-top overflow-hidden transition-[max-height,opacity] duration-400 ease-out ${
            aberto ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="container-somma pb-8 pt-20">
            <ul className="divide-y divide-white/10">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setAberto(false)}
                    className="flex min-h-[56px] items-center justify-between text-[17px] text-white/90 active:text-primary"
                  >
                    {item.label}
                    <span aria-hidden className="text-white/25">
                      ›
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#inscricao"
              onClick={() => setAberto(false)}
              className="btn-primary mt-6 w-full"
            >
              Entrar na lista VIP
            </a>
          </div>
        </div>
      </div>

      {aberto && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
    </>
  );
}
