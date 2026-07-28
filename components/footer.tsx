import Image from "next/image";
import { EVENTO, NAV, SOMMA } from "@/lib/napraia-data";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dark-bg pb-28 pt-16 safe-bottom sm:pb-16 sm:pt-20">
      <div className="container-somma">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Marcas da collab */}
          <div className="lg:col-span-2">
            <a
              href={SOMMA.links.site}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={SOMMA.nome}
              className="mb-5 inline-flex"
            >
              <Image
                src={SOMMA.logo}
                alt={SOMMA.nome}
                width={146}
                height={39}
                className="h-[39px] w-auto"
              />
            </a>

            <p className="mb-6 max-w-sm text-[14px] leading-6 text-white/45">
              {EVENTO.nome}: {EVENTO.distancia} com largada e chegada dentro do{" "}
              {EVENTO.local.nome}. {EVENTO.dataExtenso}, com day use até as{" "}
              {EVENTO.dayUseAte}.
            </p>

            <div className="flex gap-3">
              <Social href={SOMMA.links.instagram} label="Instagram do Somma Club">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </Social>
              <Social href={SOMMA.links.strava} label="Clube do Somma no Strava" filled>
                <polygon points="226.172,26.001 90.149,288.345 170.29,288.345 226.172,184.036 281.605,288.345 361.116,288.345" />
                <polygon points="361.116,288.345 321.675,367.586 281.605,288.345 220.871,288.345 321.675,485.999 421.851,288.345" />
              </Social>
            </div>
          </div>

          {/* Navegação */}
          <nav aria-label="Rodapé">
            <h2 className="mb-4 text-[13px] font-semibold text-white">Nesta página</h2>
            <ul className="space-y-2.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-[14px] text-white/45 transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#inscricao"
                  className="text-[14px] text-white/45 transition-colors hover:text-primary"
                >
                  Lista VIP
                </a>
              </li>
            </ul>
          </nav>

          {/* Contato */}
          <div>
            <h2 className="mb-4 text-[13px] font-semibold text-white">Contato</h2>
            <ul className="space-y-2.5 text-[14px] text-white/45">
              <li>
                <a
                  href={`mailto:${SOMMA.links.email}`}
                  className="transition-colors hover:text-primary"
                >
                  {SOMMA.links.email}
                </a>
              </li>
              <li>
                <a
                  href={SOMMA.links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  {SOMMA.links.telefone}
                </a>
              </li>
              <li>
                <a
                  href={SOMMA.links.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  sommaclub.com.br
                </a>
              </li>
              <li className="pt-1 leading-6">
                {EVENTO.local.endereco}
                <br />
                {EVENTO.local.bairro}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-7">
          <p className="text-[12px] leading-5 text-white/30">
            © 2026 Somma Running Club · CNPJ {SOMMA.cnpj}
          </p>
        </div>
      </div>
    </footer>
  );
}

function Social({
  href,
  label,
  children,
  filled = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  filled?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/60 transition-colors hover:border-primary hover:text-primary active:scale-95"
    >
      <svg
        viewBox={filled ? "0 0 512 512" : "0 0 24 24"}
        className="h-[18px] w-[18px]"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </a>
  );
}
