import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GeocodingResult } from '../models/geocoding-result.model';

// Forma cruda tal cual la devuelve Nominatim — nunca se expone al resto de
// la app, se convierte a GeocodingResult acá mismo.
interface NominatimRawResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Buscador de direcciones con Nominatim (geocodificador gratuito de
// OpenStreetMap) — coherente con la regla del proyecto de no usar Google
// Maps salvo que sea estrictamente necesario.
//
// ⚠️ Política de uso de Nominatim (https://operations.osmfoundation.org/policies/nominatim/):
// máx. 1 request/seg y no usarlo para autocompletar sin debounce (por eso
// map.page.ts hace debounceTime(400) antes de llamar acá). Para volumen alto
// en producción conviene un Nominatim propio (self-hosted) o un servicio de
// pago (Mapbox, LocationIQ, etc.).
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  search(query: string): Observable<GeocodingResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      countrycodes: 'ar', // acotar resultados a Argentina
      limit: '5'
    });

    return this.http.get<NominatimRawResult[]>(`${this.baseUrl}?${params.toString()}`).pipe(
      map((results) =>
        results.map((r) => ({
          displayName: r.display_name,
          latitude: parseFloat(r.lat),
          longitude: parseFloat(r.lon)
        }))
      )
    );
  }
}
