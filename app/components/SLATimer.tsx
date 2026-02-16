'use client';

import { useState, useEffect, useRef } from 'react';
import { SLA, getSLADuration, isBusinessDaysType, calculateElapsedTime } from '@/app/types/sla';
import { saveSLA } from '@/app/utils/slaStorage';

interface SLATimerProps {
  sla: SLA;
  onComplete?: () => void;
  onUpdate?: () => void;
}

export default function SLATimer({ sla, onComplete, onUpdate }: SLATimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [editingTime, setEditingTime] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const duration = getSLADuration(sla);
  const isBusinessDays = isBusinessDaysType(sla.sopId, sla.type);
  const remaining = Math.max(0, duration - elapsed);
  const isOverdue = elapsed > duration;

  useEffect(() => {
    if (sla.status === 'active') {
      const updateTimer = () => {
        const now = Date.now();
        const elapsedTime = calculateElapsedTime(sla.startTime, now, isBusinessDays);
        setElapsed(elapsedTime);
      };

      updateTimer();
      intervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [sla.status, sla.startTime, sla.timeAdjustment, isBusinessDays]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = isOverdue ? 0 : Math.min(1, elapsed / duration);
  const progressPercent = progress * 100;

  // Determinar color según el progreso
  let progressColor = '#4CAF50'; // Verde
  let timerColor = '#4CAF50';
  
  if (progress > 0.33 && progress <= 0.66) {
    progressColor = '#FFC107'; // Amarillo
    timerColor = '#FFC107';
  } else if (progress > 0.66 || isOverdue) {
    progressColor = '#F44336'; // Rojo
    timerColor = '#F44336';
  }

  if (isOverdue) {
    timerColor = '#F44336';
  }

  const handleAdjustTime = (isAdd: boolean) => {
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes === 0) return;
    
    const adjustmentMs = totalMinutes * 60 * 1000;
    const newAdjustment = (sla.timeAdjustment || 0) + (isAdd ? adjustmentMs : -adjustmentMs);
    const updated = { ...sla, timeAdjustment: newAdjustment };
    saveSLA(updated);
    setHours(0);
    setMinutes(0);
    setEditingTime(false);
    
    // Forzar actualización inmediata
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px'
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: timerColor,
          fontFamily: 'monospace',
          flex: 1
        }}>
          {isOverdue ? '+' : ''}{formatTime(isOverdue ? elapsed - duration : remaining)}
        </div>
        {!editingTime ? (
          <button
            onClick={() => setEditingTime(true)}
            style={{
              padding: '8px 16px',
              background: '#6B6B6B',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            Editar tiempo
          </button>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: '8px',
            border: '2px solid #FF6B35',
            minWidth: '200px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Horas</label>
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: '60px',
                    padding: '6px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                />
              </div>
              <span style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '20px' }}>:</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Minutos</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  style={{
                    width: '60px',
                    padding: '6px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                />
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => handleAdjustTime(true)}
                disabled={hours === 0 && minutes === 0}
                style={{
                  padding: '8px 16px',
                  background: hours === 0 && minutes === 0 ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: hours === 0 && minutes === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  flex: 1
                }}
              >
                Agregar
              </button>
              <button
                onClick={() => handleAdjustTime(false)}
                disabled={hours === 0 && minutes === 0}
                style={{
                  padding: '8px 16px',
                  background: hours === 0 && minutes === 0 ? '#ccc' : '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: hours === 0 && minutes === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  flex: 1
                }}
              >
                Restar
              </button>
            </div>
            <button
              onClick={() => {
                setEditingTime(false);
                setHours(0);
                setMinutes(0);
              }}
              style={{
                padding: '6px 12px',
                background: '#6B6B6B',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                width: '100%'
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      <div style={{
        width: '100%',
        height: '30px',
        backgroundColor: '#e0e0e0',
        borderRadius: '15px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '20px'
      }}>
        <div style={{
          width: `${isOverdue ? 0 : progressPercent}%`,
          height: '100%',
          backgroundColor: progressColor,
          transition: 'width 0.3s ease, background-color 0.3s ease',
          borderRadius: '15px'
        }} />
        {isOverdue && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#F44336',
            opacity: 0.3
          }} />
        )}
      </div>

      {isOverdue && (
        <div style={{
          textAlign: 'center',
          color: '#F44336',
          fontSize: '14px',
          marginTop: '10px'
        }}>
          Tiempo excedido
        </div>
      )}
    </div>
  );
}

