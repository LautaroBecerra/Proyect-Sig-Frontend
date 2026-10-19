// El backend guarda "severity" como texto libre (no es un enum cerrado —
// ver flood.reports.interface.ts), así que acá solo le damos una forma
// visual a los valores más comunes. Cualquier otro texto se muestra tal
// cual, con un estilo neutro, en vez de romper o inventar una categoría.
export interface SeverityMeta {
  label: string;
  color: string;
  icon: string;
}

export function getSeverityMeta(severity: string | null | undefined): SeverityMeta {
  const value = (severity ?? '').trim().toLowerCase();

  switch (value) {
    case 'leve':
      return { label: 'Leve', color: 'success', icon: 'checkmark-circle-outline' };
    case 'moderado':
    case 'moderada':
      return { label: 'Moderado', color: 'warning', icon: 'alert-circle-outline' };
    case 'grave':
    case 'alto':
    case 'alta':
      return { label: 'Grave', color: 'danger', icon: 'warning-outline' };
    default:
      return {
        label: severity?.trim() ? severity : 'Sin especificar',
        color: 'medium',
        icon: 'help-circle-outline'
      };
  }
}
