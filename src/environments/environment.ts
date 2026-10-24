export const environment = {
  production: false,
  // Confirmado contra flood.reports.controller.ts: las rutas cuelgan de /api
  apiUrl: 'http://localhost:3000/api',
  // TODO: completar con el Client ID real (Google Cloud Console → Credenciales
  // → OAuth 2.0 Client ID → Web application). Mientras esté vacío, el botón
  // "Continuar con Google" en login.page.ts no se inicializa.
  googleClientId: '914241103357-eac00fcfqrq4vc978kqh1keo1dg6ta00.apps.googleusercontent.com'
};
