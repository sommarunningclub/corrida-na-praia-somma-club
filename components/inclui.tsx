import { Reveal } from "@/components/ui/reveal";
import { DUAS_EXPERIENCIAS, INCLUI } from "@/lib/napraia-data";

export function Inclui() {
  return (
    <section id="inclui" className="section bg-navy-deep">
      <div className="container-somma">
        {/* Uma inscrição, duas experiências */}
        <div className="mb-14 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-4">{DUAS_EXPERIENCIAS.eyebrow}</p>
            <h2 className="section-title mb-6 text-white">{DUAS_EXPERIENCIAS.titulo}</h2>
            {DUAS_EXPERIENCIAS.paragrafos.map((p) => (
              <p
                key={p}
                className="mb-4 text-[16px] leading-7 text-white/60 sm:text-lg sm:leading-8"
              >
                {p}
              </p>
            ))}
          </Reveal>

          <Reveal delay={0.1} className="grid gap-4 sm:grid-cols-2" stagger={0.1}>
            <div className="rounded-panel border border-primary/30 bg-primary/10 p-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Para você
              </p>
              <p className="text-[17px] font-semibold leading-snug text-white">
                Corrida de 6 km e Dia Na Praia até as 17h
              </p>
            </div>
            <div className="rounded-panel border border-white/12 bg-white/[0.05] p-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-r2">
                Cortesia
              </p>
              <p className="text-[17px] font-semibold leading-snug text-white">
                Um acompanhante no Dia Na Praia
              </p>
              <p className="mt-3 text-[13px] leading-5 text-white/45">
                {DUAS_EXPERIENCIAS.nota}
              </p>
            </div>
          </Reveal>
        </div>

        {/* O que a cortesia cobre e o que não cobre */}
        <Reveal className="mb-14 rounded-panel border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="mb-6 text-[17px] font-semibold leading-snug text-white sm:text-[19px]">
            {DUAS_EXPERIENCIAS.cortesiaTitulo}
          </p>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                A cortesia dá direito a
              </p>
              <ul className="space-y-2.5">
                {DUAS_EXPERIENCIAS.cortesiaInclui.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[14px] leading-6 text-white/75"
                  >
                    <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-primary">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3 w-3"
                        fill="none"
                        stroke="#fff"
                        strokeWidth={3.5}
                        aria-hidden
                      >
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                A cortesia não dá direito a
              </p>
              <ul className="space-y-2.5">
                {DUAS_EXPERIENCIAS.cortesiaNaoInclui.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[14px] leading-6 text-white/50"
                  >
                    <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-white/20">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-[10px] w-[10px]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3.5}
                        aria-hidden
                      >
                        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* O que está incluído */}
        <Reveal className="mb-8">
          <p className="eyebrow mb-4">O QUE ESTÁ INCLUÍDO</p>
          <h2 className="section-title text-white">Tudo isso no ingresso</h2>
        </Reveal>

        <Reveal className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
          {INCLUI.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-primary">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  stroke="#fff"
                  strokeWidth={3.5}
                  aria-hidden
                >
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[15px] leading-6 text-white/75">{item}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
