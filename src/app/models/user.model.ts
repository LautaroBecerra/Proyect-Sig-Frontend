// ⚠️ Estructura ASUMIDA. Ajustar cuando se implemente autenticación en el backend.

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}
