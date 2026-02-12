import { SLA, getSLATypeDuration, getSLADuration, getSLATypesForSOP } from '@/app/types/sla';

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const STORAGE_KEY = 'slas';

export const saveSLA = (sla: SLA): void => {
  const slas = getAllSLAs();
  const index = slas.findIndex(s => s.id === sla.id);
  
  // Calcular fechas siempre para asegurar que estén actualizadas
  let slaToSave = { ...sla };
  slaToSave.startDate = formatDate(slaToSave.startTime);
  const duration = getSLADuration(slaToSave);
  slaToSave.endDate = formatDate(slaToSave.startTime + duration);
  
  if (index >= 0) {
    slas[index] = slaToSave;
  } else {
    slas.push(slaToSave);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slas));
};

export const getAllSLAs = (): SLA[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  const slas: SLA[] = stored ? JSON.parse(stored) : [];
  
  // Agregar fechas a SLA's antiguos que no las tengan
  return slas.map(sla => {
    if (!sla.startDate || !sla.endDate) {
      sla.startDate = formatDate(sla.startTime);
      const duration = getSLADuration(sla);
      sla.endDate = formatDate(sla.startTime + duration);
    }
    // Migrar tipos antiguos 'A' y 'B' a los nuevos tipos
    if (sla.type === 'A' || sla.type === 'B') {
      const types = getSLATypesForSOP(sla.sopId);
      if (types.length > 0) {
        // Asignar el primer tipo disponible como migración
        sla.type = types[0].id;
      }
    }
    return sla;
  });
};

export const getSLAsBySOP = (sopId: string): SLA[] => {
  return getAllSLAs().filter(sla => sla.sopId === sopId);
};

export const getSLAById = (id: string): SLA | null => {
  const slas = getAllSLAs();
  return slas.find(sla => sla.id === id) || null;
};

export const deleteSLA = (id: string): void => {
  const slas = getAllSLAs().filter(sla => sla.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slas));
};

export const createSLA = (name: string, type: string, sopId: string, asignacion?: string, encargado?: string): SLA => {
  const startTime = Date.now();
  const duration = getSLATypeDuration(sopId, type);
  const endTime = startTime + duration;
  
  return {
    id: `sla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    status: 'active',
    startTime,
    startDate: formatDate(startTime),
    endDate: formatDate(endTime),
    sopId,
    asignacion,
    encargado,
  };
};

