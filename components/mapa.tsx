"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { EVENTO } from "@/lib/napraia-data";
import { estiloMapa, PALETAS, type NomePaleta } from "@/lib/mapa-estilo";

type OverlayCtor = typeof google.maps.OverlayView;

/**
 * Overlay HTML no ponto da largada: selo Na Praia com leve 3D + pulso.
 * OverlayView permite CSS/animação; Marker clássico não.
 */
function montarMarcador3D(
  OverlayView: OverlayCtor,
  LatLng: typeof google.maps.LatLng,
  map: google.maps.Map,
  position: google.maps.LatLngLiteral
) {
  class NapraiaMarker extends OverlayView {
    private el: HTMLDivElement | null = null;

    onAdd() {
      const wrap = document.createElement("div");
      wrap.className = "napraia-map-pin";
      wrap.setAttribute("role", "img");
      wrap.setAttribute(
        "aria-label",
        `${EVENTO.local.nome} · largada e chegada`
      );
      wrap.innerHTML = `
        <span class="napraia-map-pin__ring" aria-hidden="true"></span>
        <span class="napraia-map-pin__ring napraia-map-pin__ring--delay" aria-hidden="true"></span>
        <span class="napraia-map-pin__shadow" aria-hidden="true"></span>
        <img
          class="napraia-map-pin__logo"
          src="/logo-napraia.png"
          alt=""
          width="88"
          height="88"
          draggable="false"
        />
      `;
      this.getPanes()?.overlayMouseTarget.appendChild(wrap);
      this.el = wrap;
    }

    draw() {
      const projection = this.getProjection();
      if (!projection || !this.el) return;
      const point = projection.fromLatLngToDivPixel(
        new LatLng(position.lat, position.lng)
      );
      if (!point) return;
      this.el.style.left = `${point.x}px`;
      this.el.style.top = `${point.y}px`;
    }

    onRemove() {
      this.el?.remove();
      this.el = null;
    }
  }

  const marker = new NapraiaMarker();
  marker.setMap(map);
  return marker;
}

export function Mapa({ paleta = "praia" }: { paleta?: NomePaleta }) {
  const ref = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !ref.current) {
      setErro(true);
      return;
    }

    let cancelado = false;
    let overlay: google.maps.OverlayView | null = null;

    setOptions({ key, v: "weekly" });

    (async () => {
      try {
        const [{ Map, OverlayView }, { LatLng }] = await Promise.all([
          importLibrary("maps"),
          importLibrary("core"),
        ]);
        if (cancelado || !ref.current) return;

        const { lat, lng } = EVENTO.local.geo;

        const map = new Map(ref.current, {
          center: { lat, lng },
          zoom: 15,
          // Mapa de ruas: o texto da seção cita as vias do trajeto, e no
          // satélite não dava para seguir nenhuma delas.
          mapTypeId: "roadmap",
          styles: estiloMapa(PALETAS[paleta]),
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
          clickableIcons: false,
          keyboardShortcuts: false,
        });

        overlay = montarMarcador3D(OverlayView, LatLng, map, { lat, lng });
      } catch (err) {
        console.error("[mapa] Falha ao carregar o Google Maps:", err);
        if (!cancelado) setErro(true);
      }
    })();

    return () => {
      cancelado = true;
      overlay?.setMap(null);
    };
  }, [paleta]);

  if (erro) {
    return (
      <a
        href={EVENTO.local.maps}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 rounded-card bg-light p-8 text-center transition-colors hover:bg-black/[0.06]"
      >
        <span className="eyebrow">{EVENTO.local.nome}</span>
        <span className="text-[15px] font-medium text-ink">{EVENTO.local.endereco}</span>
        <span className="text-sm text-muted">{EVENTO.local.bairro}</span>
        <span className="mt-2 text-sm font-semibold text-primary">Abrir no Google Maps →</span>
      </a>
    );
  }

  return (
    <div
      ref={ref}
      role="application"
      aria-label={`Mapa das vias do percurso, com o ponto de largada em ${EVENTO.local.nome}`}
      // Fundo igual ao terreno do estilo: sem flash escuro antes de carregar.
      className="h-full min-h-[280px] w-full rounded-card"
      style={{ backgroundColor: PALETAS[paleta].terra }}
    />
  );
}
