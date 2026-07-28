"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registro do plugin em um só lugar — importar este módulo em vez de
// registrar solto em cada componente. registerPlugin é idempotente.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Respeita a preferência de sistema por menos movimento. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
