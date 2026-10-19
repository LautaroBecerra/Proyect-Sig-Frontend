// Opciones y tipos del formulario de creación de reportes. Separado del
// componente para poder reusar las listas (ej. si más adelante hace falta
// un filtro "por tipo de incidente" en el mapa).

export type IncidentTypeKey =
  | 'calle_con_agua'
  | 'calle_cortada'
  | 'calle_erosionada'
  | 'agua_en_viviendas'
  | 'boca_tormenta_obstruida'
  | 'canal_desbordado';

export interface IncidentTypeOption {
  key: IncidentTypeKey;
  emoji: string;
  label: string;
}

export const INCIDENT_TYPES: IncidentTypeOption[] = [
  { key: 'calle_con_agua', emoji: '💧', label: 'Calle con agua' },
  { key: 'calle_cortada', emoji: '🚫', label: 'Calle cortada' },
  { key: 'calle_erosionada', emoji: '🛣️', label: 'Calle erosionada o socavada' },
  { key: 'agua_en_viviendas', emoji: '🏠', label: 'Agua dentro de viviendas' },
  { key: 'boca_tormenta_obstruida', emoji: '🕳️', label: 'Boca de tormenta obstruida' },
  { key: 'canal_desbordado', emoji: '🌊', label: 'Canal o zanja desbordada' }
];

export type TirranteRangeKey = '0_5' | '5_20' | '20_50' | '50_100' | 'mas_100';

export interface TirranteRangeOption {
  key: TirranteRangeKey;
  label: string;
}

export const TIRANTE_RANGES: TirranteRangeOption[] = [
  { key: '0_5', label: '0 a 5 cm' },
  { key: '5_20', label: '5 a 20 cm' },
  { key: '20_50', label: '20 a 50 cm' },
  { key: '50_100', label: '50 cm a 1 m' },
  { key: 'mas_100', label: 'Más de 1 m' }
];

export type SiNo = 'si' | 'no';

// 'no' = no evacuó. Los otros dos son las dos variantes de "sí" del punto 4.
export type EvacuacionEstado = 'no' | 'autoevacuacion' | 'evacuados_organismo';

export type TrabajoDetalle = 'actividad_propia' | 'no_llego' | 'perdidas_economicas';

export type ServicioAfectado = 'sin_luz' | 'sin_agua' | 'desborde_cloacal';

export type AsistenciaNecesaria = 'limpieza' | 'colchones' | 'alimentos' | 'atencion_medica';

// Forma final que arma el formulario al enviarse. Adaptada del objeto
// sugerido en el punto 10 del pedido, pero organizada en "público" vs
// "privado" para que sea evidente qué no debería exponerse en el mapa.
export interface FloodReportFormValue {
  tipoIncidente: IncidentTypeKey[];
  rangoTirante: TirranteRangeKey | null;
  descripcion: string;
  problemaPresente: SiNo | null;

  // Preguntas de seguimiento PÚBLICAS, disparadas por tipoIncidente.
  seguimiento: {
    aguaViviendaNormalizada: SiNo | null;
    calleTransitable: SiNo | null;
    calleReparada: SiNo | null;
  };

  // Todo lo de acá adentro es información privada (ver nota en el
  // componente y en la sección 4 del pedido) — no se muestra públicamente.
  privado: {
    evacuacion: EvacuacionEstado;
    familiaRegreso: SiNo | null; // solo tiene sentido si evacuacion !== 'no'
    trabajoAfectado: boolean;
    trabajoDetalle: TrabajoDetalle[];
    actividadRetomada: SiNo | null; // solo tiene sentido si trabajoAfectado === true
    serviciosAfectados: ServicioAfectado[];
    asistenciaNecesaria: AsistenciaNecesaria[];
  };

  fotografia: File | null;
}
