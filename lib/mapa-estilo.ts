/**
 * Estilo do mapa do percurso (Google Maps, mapa de ruas).
 *
 * Trocamos o satélite por mapa de ruas para as vias do trajeto aparecerem: o
 * texto da seção cita SCES Trecho 2, Estrada Parque das Nações e SCES Trecho 3,
 * e no satélite não dava para seguir nenhuma delas.
 *
 * A paleta puxa para a R2 (âmbar) e para o creme da própria seção, em vez do
 * laranja do Somma, que domina o resto da página.
 *
 * Só funciona em mapa raster: se algum dia passarmos um mapId nas opções, o
 * Google ignora `styles` e o estilo tem que ir para o console dele.
 */

export interface PaletaMapa {
  /** Terreno, casando com o bg-cream da seção. */
  terra: string;
  /** Quadras e áreas construídas, um tom acima do terreno. */
  construido: string;
  /** Lago Paranoá. */
  agua: string;
  /** Parques e áreas verdes. */
  verde: string;
  /** Quadras de clubes e demais áreas de lazer, um verde mais lavado. */
  verdeSuave: string;
  /** Corpo das vias comuns. */
  via: string;
  /** Contorno das vias comuns. */
  viaBorda: string;
  /** Vias principais, as do trajeto. */
  viaPrincipal: string;
  /** Contorno das vias principais. */
  viaPrincipalBorda: string;
  /** Texto dos rótulos. */
  texto: string;
  /** Halo do texto, para ler sobre qualquer fundo. */
  textoHalo: string;
  /** Rótulo das vias principais. */
  textoVia: string;
}

export const PALETAS = {
  /** Creme da seção, vias em âmbar da R2, lago no azul do hero. */
  praia: {
    terra: "#FDF3E3",
    construido: "#F6E7CE",
    agua: "#1B3BB5",
    verde: "#CFE3B4",
    verdeSuave: "#E2EFD2",
    via: "#FFFFFF",
    viaBorda: "#E7D3B1",
    viaPrincipal: "#FCAD00",
    viaPrincipalBorda: "#E09600",
    texto: "#3B2A12",
    textoHalo: "#FFF9EF",
    textoVia: "#7A5200",
  },
  /** Mais pop: lago turquesa, verdes vivos, âmbar nas vias. */
  festival: {
    terra: "#FFF6E6",
    construido: "#FBE6C8",
    agua: "#00A6C0",
    verde: "#8FD17A",
    verdeSuave: "#C6E8B8",
    via: "#FFFFFF",
    viaBorda: "#F0D6AC",
    viaPrincipal: "#FCAD00",
    viaPrincipalBorda: "#DE9400",
    texto: "#0C3B44",
    textoHalo: "#FFFFFF",
    textoVia: "#8A5A00",
  },
  /** Roxo como acento, âmbar nas vias, lago em violeta profundo. */
  roxo: {
    terra: "#FBF1E8",
    construido: "#F2E2E9",
    agua: "#5B21B6",
    verde: "#C4B5E8",
    verdeSuave: "#E2DAF4",
    via: "#FFFFFF",
    viaBorda: "#E3D2E2",
    viaPrincipal: "#FCAD00",
    viaPrincipalBorda: "#D99A00",
    texto: "#3B1E55",
    textoHalo: "#FFFFFF",
    textoVia: "#6D28D9",
  },
} as const satisfies Record<string, PaletaMapa>;

export type NomePaleta = keyof typeof PALETAS;

/** Monta o array de estilos do Google Maps a partir de uma paleta. */
export function estiloMapa(p: PaletaMapa): google.maps.MapTypeStyle[] {
  return [
    { elementType: "geometry", stylers: [{ color: p.terra }] },
    { elementType: "labels.text.fill", stylers: [{ color: p.texto }] },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: p.textoHalo }, { weight: 3 }],
    },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },

    { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: p.construido }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: p.agua }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: p.textoHalo }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },

    // O trajeto corre pelo Setor de Clubes Esportivos: as quadras dos clubes
    // são o que dá cor à área, então elas ficam visíveis e pintadas. Só os
    // rótulos e ícones saem, senão o mapa vira uma lista de nomes.
    { featureType: "poi", elementType: "geometry", stylers: [{ color: p.verdeSuave }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: p.verde }] },
    { featureType: "poi.sports_complex", elementType: "geometry", stylers: [{ color: p.verde }] },
    { featureType: "landscape.natural.landcover", elementType: "geometry", stylers: [{ color: p.verde }] },
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },

    // Vias: corpo branco com contorno quente, para o traçado saltar do creme.
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: p.via }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: p.viaBorda }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: p.textoVia }] },

    // As vias do trajeto ganham o âmbar da R2.
    { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: p.viaPrincipal }] },
    { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: p.viaPrincipalBorda }] },
    { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: p.viaPrincipal }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: p.viaPrincipalBorda }] },

    // O nome das ruas é o ponto do mapa novo: fica sempre ligado.
    { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  ];
}
