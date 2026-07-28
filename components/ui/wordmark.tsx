import Image from "next/image";
import { R2, SOMMA } from "@/lib/napraia-data";

// Proporções reais dos arquivos em /public.
const SOMMA_RATIO = 1280 / 342;
const R2_RATIO = 155 / 80;

/**
 * Lockup da collab: logo oficial do Somma (versão branca) + logo da R2.
 * Alinhado pela base para as duas marcas sentarem na mesma linha.
 */
export function Wordmark({
  size = "sm",
  r2 = true,
  className,
}: {
  size?: "sm" | "lg";
  r2?: boolean;
  className?: string;
}) {
  const alturaSomma = size === "lg" ? 34 : 26;
  const alturaR2 = size === "lg" ? 32 : 26;

  return (
    <span className={`flex items-center gap-3 ${className ?? ""}`}>
      <Image
        src={SOMMA.logo}
        alt={SOMMA.nome}
        width={Math.round(alturaSomma * SOMMA_RATIO)}
        height={alturaSomma}
        priority
        className="w-auto"
        style={{ height: alturaSomma }}
      />

      {r2 && (
        <>
          <span
            aria-hidden
            className="text-base font-medium leading-none text-white/30"
          >
            &amp;
          </span>
          <Image
            src={R2.logo}
            alt={R2.nome}
            width={Math.round(alturaR2 * R2_RATIO)}
            height={alturaR2}
            className="w-auto"
            style={{ height: alturaR2 }}
          />
        </>
      )}
    </span>
  );
}
