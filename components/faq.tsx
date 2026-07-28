import { Reveal } from "@/components/ui/reveal";
import { FAQ as PERGUNTAS, SOMMA } from "@/lib/napraia-data";

export function Faq() {
  return (
    <section id="faq" className="section bg-light" aria-labelledby="faq-titulo">
      <div className="container-somma max-w-3xl">
        <Reveal className="mb-10 text-center">
          <p className="eyebrow mb-4">DÚVIDAS</p>
          <h2 id="faq-titulo" className="section-title">
            Perguntas frequentes
          </h2>
        </Reveal>

        <Reveal className="space-y-3" stagger={0.05}>
          {PERGUNTAS.map((item) => (
            <details
              key={item.q}
              className="group rounded-card border border-black/10 bg-white px-5 py-1 transition-shadow open:shadow-card sm:px-6"
            >
              <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-semibold leading-snug text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xl font-light leading-none text-primary transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 pr-10 text-[15px] leading-7 text-muted">{item.a}</p>
            </details>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="mt-10 text-center">
          <p className="text-sm text-muted">
            Ficou alguma dúvida?{" "}
            <a
              href={SOMMA.links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Chama no WhatsApp
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
