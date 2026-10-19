// Modelo alineado con FloodReportModel / flood.reports.interface.ts del backend real.
// Campos confirmados: id, user_id, latitude, longitude, description, severity, created_at
// (snake_case, tal cual los devuelve la API — no hay updatedAt ni status).

export interface FloodReport {
  id: number;
  user_id: number;
  latitude: number;
  longitude: number;

  description: string | null;
  severity: string | null;

  incident_type: string | null;
  water_depth_range: string | null;
  problem_persists: boolean | null;

  evacuation: string | null;
  work_affected: string | null;
  services_affected: string[] | null;
  assistance_needed: string[] | null;

  status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
}

// ✅ Confirmado contra flood.reports.interface.ts / flood.reports.services.ts:
// user_id, latitude y longitude son obligatorios (el service valida rangos
// -90..90 / -180..180 del lado del backend). severity es texto libre, no un
// enum cerrado. user_id sigue siendo temporal hasta que exista login.
export interface CreateFloodReportDto {
  user_id: number;
  latitude: number;
  longitude: number;
  description?: string;
  severity?: string;
}

// Coincide exactamente con UpdateFloodReport del backend: no permite tocar user_id.
export interface UpdateFloodReportDto {
  latitude?: number;
  longitude?: number;
  description?: string;
  severity?: string;
}

// Todas las respuestas del backend vienen envueltas en este sobre.
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
