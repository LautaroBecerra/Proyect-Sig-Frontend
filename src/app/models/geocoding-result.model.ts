// Resultado de búsqueda ya normalizado para uso interno de la app.
// El GeocodingService se encarga de convertir la respuesta cruda de
// Nominatim (display_name, lat, lon como strings) a esta forma.
export interface GeocodingResult {
  displayName: string;
  latitude: number;
  longitude: number;
}
