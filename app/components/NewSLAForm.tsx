'use client';

import { useState, useEffect } from 'react';
import { getSLATypesForSOP } from '@/app/types/sla';
import { createSLA, saveSLA } from '@/app/utils/slaStorage';

interface NewSLAFormProps {
  sopId: string;
  onSave: (slaId: string) => void;
}

// Función para formatear la duración en formato legible
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} ${days === 1 ? 'día' : 'días'}`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  } else {
    return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
  }
};

export default function NewSLAForm({ sopId, onSave }: NewSLAFormProps) {
  const slaTypes = getSLATypesForSOP(sopId);
  const [name, setName] = useState('');
  const [type, setType] = useState(slaTypes.length > 0 ? slaTypes[0].id : '');
  const [asignacion, setAsignacion] = useState('');
  const [encargado, setEncargado] = useState('');
  const [error, setError] = useState('');

  // Actualizar el tipo cuando cambie el sopId
  useEffect(() => {
    if (slaTypes.length > 0) {
      setType(slaTypes[0].id);
    }
  }, [sopId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!type) {
      setError('Debe seleccionar un tipo de SLA');
      return;
    }

    const sla = createSLA(name.trim(), type, sopId, asignacion.trim() || undefined, encargado.trim() || undefined);
    saveSLA(sla);
    onSave(sla.id);
    
    // Reset form
    setName('');
    setType(slaTypes.length > 0 ? slaTypes[0].id : '');
    setAsignacion('');
    setEncargado('');
  };

  return (
    <div className="card">
      <h2 style={{ color: '#FF6B35', marginBottom: '24px' }}>Nuevo SLA</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600',
            color: '#333'
          }}>
            Nombre del SLA *
          </label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ingresa el nombre del SLA"
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600',
            color: '#333'
          }}>
            Tipo *
          </label>
          {slaTypes.length > 0 ? (
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              {slaTypes.map((slaType) => (
                <option key={slaType.id} value={slaType.id}>
                  {slaType.name}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ 
              padding: '12px', 
              background: '#f8d7da', 
              color: '#721c24', 
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              No hay tipos de SLA disponibles para este SOP.
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600',
            color: '#333'
          }}>
            Asignación
          </label>
          <input
            type="text"
            className="input"
            value={asignacion}
            onChange={(e) => setAsignacion(e.target.value)}
            placeholder="Ingresa la asignación"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600',
            color: '#333'
          }}>
            Encargado
          </label>
          <input
            type="text"
            className="input"
            value={encargado}
            onChange={(e) => setEncargado(e.target.value)}
            placeholder="Ingresa el encargado"
          />
        </div>

        {error && (
          <div style={{ 
            color: '#dc3545', 
            marginBottom: '16px', 
            padding: '12px',
            background: '#f8d7da',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Crear SLA
        </button>
      </form>
    </div>
  );
}

