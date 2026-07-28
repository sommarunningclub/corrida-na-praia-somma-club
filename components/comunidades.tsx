import { Reveal } from "@/components/ui/reveal";
import { COMUNIDADES } from "@/lib/napraia-data";
import { Wordmark } from "@/components/ui/wordmark";

export function Comunidades() {
  return (
    <section className="section bg-navy">
      <div className="container-somma">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow mb-4">{COMUNIDADES.eyebrow}</p>
          <h2 className="section-title mb-6 text-white">{COMUNIDADES.titulo}</h2>
          {COMUNIDADES.paragrafos.map((p) => (
            <p
              key={p}
              className="mx-auto mb-4 max-w-2xl text-[16px] leading-7 text-white/60 sm:text-lg sm:leading-8"
            >
              {p}
            </p>
          ))}

          <div className="mt-10 flex justify-center">
            <Wordmark size="lg" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
