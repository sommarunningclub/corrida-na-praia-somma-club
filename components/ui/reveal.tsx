"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Atraso em segundos antes de iniciar. */
  delay?: number;
  /** Deslocamento vertical inicial, em px. */
  y?: number;
  /** Anima os filhos diretos em cascata em vez do elemento inteiro. */
  stagger?: number;
  id?: string;
};

/**
 * Entrada por scroll com GSAP + ScrollTrigger.
 * Começa em .gsap-hidden e só revela quando o JS assume — sem JS,
 * o <noscript> do layout devolve a opacidade.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
  y = 28,
  stagger,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 });
      if (stagger) gsap.set(el.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const targets = stagger ? Array.from(el.children) : el;

      gsap.set(el, { opacity: 1 });
      if (stagger) gsap.set(el.children, { opacity: 0 });

      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          delay,
          ease: "power3.out",
          stagger: stagger ?? 0,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        }
      );
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [delay, y, stagger]);

  return (
    <Tag
      id={id}
      ref={ref as React.Ref<HTMLElement>}
      className={`gsap-hidden ${className ?? ""}`}
    >
      {children}
    </Tag>
  );
}
