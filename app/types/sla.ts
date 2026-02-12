export type SLAStatus = 'active' | 'completed';

// Tipos de SLA que usan días hábiles (excluyen sábados y domingos, pausan viernes 5pm - lunes 8am)
export const BUSINESS_DAYS_TYPES: Record<string, string[]> = {
  '1': ['cotizacion-estandar', 'proyecto-medida'],
  '3': ['conciliacion-mensual'],
  '6': ['kickoff'],
  '10': ['recepcion-validacion', 'convocatoria-validacion', 'convocatoria-revision'],
  '12': ['embarque-aduana', 'picking-mexico'],
};

// Función para verificar si un tipo de SLA usa días hábiles
export function isBusinessDaysType(sopId: string, typeId: string): boolean {
  return BUSINESS_DAYS_TYPES[sopId]?.includes(typeId) || false;
}

// Función para calcular tiempo transcurrido considerando días hábiles y pausa de fin de semana
export function calculateElapsedTime(startTime: number, endTime: number, isBusinessDays: boolean): number {
  if (!isBusinessDays) {
    // Para tipos normales, simplemente calcular diferencia
    return endTime - startTime;
  }

  // Para días hábiles, calcular excluyendo fines de semana y pausa viernes 5pm - lunes 8am
  let elapsed = 0;
  let currentTime = startTime;
  
  while (currentTime < endTime) {
    const currentDate = new Date(currentTime);
    const dayOfWeek = currentDate.getDay(); // 0 = domingo, 1-5 = lunes-viernes, 6 = sábado
    const hours = currentDate.getHours();
    
    // Si es sábado, saltar al lunes 8am
    if (dayOfWeek === 6) {
      const daysUntilMonday = 2; // Sábado -> Lunes
      const nextMonday = new Date(currentDate);
      nextMonday.setDate(currentDate.getDate() + daysUntilMonday);
      nextMonday.setHours(8, 0, 0, 0);
      currentTime = nextMonday.getTime();
      continue;
    }
    
    // Si es domingo, saltar al lunes 8am
    if (dayOfWeek === 0) {
      const daysUntilMonday = 1; // Domingo -> Lunes
      const nextMonday = new Date(currentDate);
      nextMonday.setDate(currentDate.getDate() + daysUntilMonday);
      nextMonday.setHours(8, 0, 0, 0);
      currentTime = nextMonday.getTime();
      continue;
    }
    
    // Si es lunes antes de las 8am, saltar a las 8am
    if (dayOfWeek === 1 && hours < 8) {
      const monday8AM = new Date(currentDate);
      monday8AM.setHours(8, 0, 0, 0);
      currentTime = monday8AM.getTime();
      continue;
    }
    
    // Si es viernes después de las 5pm, saltar al lunes 8am
    if (dayOfWeek === 5 && hours >= 17) {
      const daysUntilMonday = 3; // Viernes -> Lunes
      const nextMonday = new Date(currentDate);
      nextMonday.setDate(currentDate.getDate() + daysUntilMonday);
      nextMonday.setHours(8, 0, 0, 0);
      currentTime = nextMonday.getTime();
      continue;
    }
    
    // Calcular hasta el próximo evento (fin de semana o viernes 5pm o endTime)
    let nextEvent: number;
    
    if (dayOfWeek === 5) {
      // Viernes: el próximo evento es viernes 5pm o endTime, el que sea menor
      const friday5PM = new Date(currentDate);
      friday5PM.setHours(17, 0, 0, 0);
      nextEvent = Math.min(friday5PM.getTime(), endTime);
    } else {
      // Lunes-Jueves: el próximo evento es el viernes 5pm o endTime
      const daysUntilFriday = 5 - dayOfWeek;
      const nextFriday = new Date(currentDate);
      nextFriday.setDate(currentDate.getDate() + daysUntilFriday);
      nextFriday.setHours(17, 0, 0, 0);
      nextEvent = Math.min(nextFriday.getTime(), endTime);
    }
    
    elapsed += nextEvent - currentTime;
    currentTime = nextEvent;
  }
  
  return elapsed;
}

// Tipos de SLA por SOP - usando el plazo máximo
export const SLA_TYPES_BY_SOP: Record<string, Array<{ id: string; name: string; durationMs: number }>> = {
  '1': [
    { id: 'cotizacion-estandar', name: 'Cotización estándar', durationMs: 3 * 24 * 60 * 60 * 1000 }, // 3 días hábiles = 3 días
    { id: 'proyecto-medida', name: 'Proyecto a medida', durationMs: 10 * 24 * 60 * 60 * 1000 }, // 10 días hábiles = 10 días
  ],
  '2': [
    { id: 'aprobacion-estandar', name: 'Aprobación estándar', durationMs: 48 * 60 * 60 * 1000 }, // 48 horas
    { id: 'urgencias', name: 'Urgencias', durationMs: 24 * 60 * 60 * 1000 }, // 24 horas
  ],
  '3': [
    { id: 'atencion-solicitud', name: 'Atención de solicitud', durationMs: 24 * 60 * 60 * 1000 }, // 24 horas
    { id: 'conciliacion-mensual', name: 'Conciliación mensual', durationMs: 5 * 24 * 60 * 60 * 1000 }, // 5 días hábiles = 5 días
  ],
  '4': [
    { id: 'aprobacion-estandar', name: 'Aprobación estándar', durationMs: 48 * 60 * 60 * 1000 }, // 48 horas
    { id: 'entrega-recibo', name: 'Entrega/recibo', durationMs: 1 * 60 * 60 * 1000 }, // TEMPORAL: 1 hora (pendiente confirmar según calendario)
  ],
  '5': [
    { id: 'agendar-cita', name: 'Agendar cita', durationMs: 72 * 60 * 60 * 1000 }, // 72 horas
    { id: 's1-respuesta', name: 'S1: Respuesta', durationMs: 2 * 60 * 60 * 1000 }, // 2 horas
    { id: 's1-onsite', name: 'S1: Onsite', durationMs: 48 * 60 * 60 * 1000 }, // 48 horas (máximo)
    { id: 's2', name: 'S2', durationMs: 8 * 60 * 60 * 1000 }, // 8 horas
    { id: 's3', name: 'S3', durationMs: 48 * 60 * 60 * 1000 }, // 48 horas (máximo)
  ],
  '6': [
    { id: 'kickoff', name: 'Kickoff', durationMs: 5 * 24 * 60 * 60 * 1000 }, // 5 días hábiles = 5 días
    { id: 'fat-sat', name: 'FAT/SAT', durationMs: 1 * 60 * 60 * 1000 }, // TEMPORAL: 1 hora (pendiente confirmar según plan)
    { id: 'cierres-administrativos', name: 'Cierres administrativos', durationMs: 10 * 24 * 60 * 60 * 1000 }, // 10 días
  ],
  '7': [
    { id: 'rfq-po', name: 'RFQ→PO', durationMs: 5 * 24 * 60 * 60 * 1000 }, // 5 días
    { id: 'lead-time', name: 'Lead time', durationMs: 1 * 60 * 60 * 1000 }, // TEMPORAL: 1 hora (pendiente confirmar según categoría)
  ],
  '8': [
    { id: 'tiempo-ensamble', name: 'Tiempo de ensamble', durationMs: 1 * 60 * 60 * 1000 }, // TEMPORAL: 1 hora (pendiente confirmar según plan)
  ],
  '9': [
    { id: 'sat-fat', name: 'SAT y FAT', durationMs: 1 * 60 * 60 * 1000 }, // TEMPORAL: 1 hora (pendiente confirmar según plazo acordado)
    { id: 'resolucion-pendientes', name: 'Tiempo de resolución de pendientes', durationMs: 10 * 24 * 60 * 60 * 1000 }, // 10 días
  ],
  '10': [
    { id: 'recepcion-validacion', name: 'Recepción y validación del requerimiento', durationMs: 1 * 24 * 60 * 60 * 1000 }, // 1 día hábil = 1 día
    { id: 'convocatoria-validacion', name: 'Convocatoria a validación de información', durationMs: 1 * 24 * 60 * 60 * 1000 }, // 1 día hábil = 1 día
    { id: 'convocatoria-revision', name: 'Convocatoria a revisión y aprobación conjunta', durationMs: 1 * 24 * 60 * 60 * 1000 }, // 1 día hábil = 1 día
  ],
  '11': [
    { id: 'generar-orden-venta', name: 'Generar orden de venta', durationMs: 1 * 24 * 60 * 60 * 1000 }, // 1 día
    { id: 'liberacion-bom', name: 'Liberación de BOM', durationMs: 24 * 60 * 60 * 1000 }, // 24 horas
    { id: 'creacion-requisicion', name: 'Creación de requisición única', durationMs: 24 * 60 * 60 * 1000 }, // 24 horas
    { id: 'ejecucion-compra', name: 'Ejecución de la compra', durationMs: 48 * 60 * 60 * 1000 }, // 48 horas
  ],
  '12': [
    { id: 'embarque-inc', name: 'Almacén HTL INC embarca mercancía a aduana', durationMs: 1 * 24 * 60 * 60 * 1000 }, // 1 día
    { id: 'embarque-aduana', name: 'Embarque en aduana', durationMs: 3 * 24 * 60 * 60 * 1000 }, // 3 días hábiles = 3 días
    { id: 'picking-mexico', name: 'Almacén HTL México realiza el picking', durationMs: 1 * 24 * 60 * 60 * 1000 }, // 1 día hábil = 1 día
  ],
};

// Función helper para obtener la duración de un tipo de SLA
export function getSLATypeDuration(sopId: string, typeId: string): number {
  const types = SLA_TYPES_BY_SOP[sopId];
  if (!types) return 0;
  const type = types.find(t => t.id === typeId);
  return type ? type.durationMs : 0;
}

// Función helper para obtener el nombre de un tipo de SLA
export function getSLATypeName(sopId: string, typeId: string): string {
  const types = SLA_TYPES_BY_SOP[sopId];
  if (!types) return typeId;
  const type = types.find(t => t.id === typeId);
  return type ? type.name : typeId;
}

// Función helper para obtener todos los tipos disponibles para un SOP
export function getSLATypesForSOP(sopId: string): Array<{ id: string; name: string; durationMs: number }> {
  return SLA_TYPES_BY_SOP[sopId] || [];
}

export interface SLA {
  id: string;
  name: string;
  type: string; // ID del tipo de SLA (ej: 'cotizacion-estandar', 'urgencias', etc.)
  status: SLAStatus;
  startTime: number; // timestamp en milisegundos
  endTime?: number; // timestamp cuando se completó
  startDate: string; // fecha de inicio formateada
  endDate: string; // fecha de fin calculada formateada
  comments?: string;
  sopId: string;
  asignacion?: string;
  encargado?: string;
  timeAdjustment?: number; // ajuste de tiempo en milisegundos (positivo = más tiempo, negativo = menos tiempo)
}

// Mantener compatibilidad con código existente usando una función
export function getSLADuration(sla: SLA): number {
  return getSLATypeDuration(sla.sopId, sla.type) + (sla.timeAdjustment || 0);
}

