"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Selo do Na Praia Festival girando devagar, com um empurrão extra
 * conforme a página rola. É o elemento gráfico de assinatura da collab.
 */
export function Sunburst({ className, src = "/logo-napraia.png" }: { className?: string; src?: string }) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Rotação contínua de base.
      gsap.to(el, { rotate: 360, duration: 70, ease: "none", repeat: -1 });

      // O scroll adiciona rotação por cima da base.
      gsap.to(el, {
        rotate: "+=180",
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
    />
  );
}
