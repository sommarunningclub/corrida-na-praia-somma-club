"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { EVENTO } from "@/lib/napraia-data";

/** Estilo monocromático para o mapa não brigar com o laranja da marca. */
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#737373" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e8e8e8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d9e0" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#8fa5b0" }] },
];

export function Mapa() {
  const ref = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !ref.current) {
      setErro(true);
      return;
    }

    let cancelado = false;

    // setOptions precisa vir antes de qualquer importLibrary.
    setOptions({ key, v: "weekly" });

    (async () => {
      try {
        const [{ Map }, { Marker }, { Point }] = await Promise.all([
          importLibrary("maps"),
          importLibrary("marker"),
          importLibrary("core"),
        ]);

        if (cancelado || !ref.current) return;
        const { lat, lng } = EVENTO.local.geo;

        const map = new Map(ref.current, {
          center: { lat, lng },
          zoom: 15,
          styles: MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative", // no mobile, 1 dedo rola a página
          clickableIcons: false,
          keyboardShortcuts: false,
        });

        new Marker({
          map,
          position: { lat, lng },
          title: `${EVENTO.local.nome} · largada ${EVENTO.horaLargada}`,
          icon: {
            path: "M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z",
            fillColor: "#FF2C03",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
            scale: 1.35,
            anchor: new Point(12, 36),
          },
        });
      } catch (err) {
        console.error("[mapa] Falha ao carregar o Google Maps:", err);
        if (!cancelado) setErro(true);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  if (erro) {
    // Fallback: o endereço nunca fica inacessível se a API falhar.
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
      aria-label={`Mapa com o ponto de largada em ${EVENTO.local.nome}`}
      className="h-full min-h-[280px] w-full rounded-card bg-light"
    />
  );
}
