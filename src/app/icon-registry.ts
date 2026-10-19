import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

// Por defecto, <ion-icon name="..."> que no está registrado se intenta
// descargar de a uno desde un CDN externo (unpkg) en el momento. Si ese CDN
// no es alcanzable (red restringida, offline, o la app corriendo empaquetada
// en Android vía Capacitor, donde esto directamente no funciona bien), el
// ícono queda en blanco — esto es lo que probablemente estaba pasando.
//
// Acá registramos TODOS los íconos de Ionicons directo en el bundle de la
// app, así nunca dependen de una descarga externa: ni los que usamos
// nosotros (person-outline, map-outline, etc.) ni los que usan por dentro
// componentes de Ionic como ion-back-button o ion-menu-button.
addIcons(allIcons);
