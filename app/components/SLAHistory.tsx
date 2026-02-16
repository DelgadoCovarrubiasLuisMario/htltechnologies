'use client';

import { useState, useEffect } from 'react';
import { SLA, getSLADuration, isBusinessDaysType, calculateElapsedTime } from '@/app/types/sla';
import { getSLAsBySOP, deleteSLA, saveSLA } from '@/app/utils/slaStorage';
import Link from 'next/link';

interface SLAHistoryProps {
  sopId: string;
  onSlaClick: (sla: SLA) => void;
}

type FilterType = 'all' | 'active' | 'completed';

export default function SLAHistory({ sopId, onSlaClick }: SLAHistoryProps) {
  const [slas, setSlas] = useState<SLA[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadSLAs();
    // Actualizar cada segundo para los timers activos
    const interval = setInterval(loadSLAs, 1000);
    return () => clearInterval(interval);
  }, [sopId, filter]);

  const loadSLAs = () => {
    const allSLAs = getSLAsBySOP(sopId);
    let filtered = allSLAs;

    if (filter === 'active') {
      filtered = allSLAs.filter(sla => sla.status === 'active');
    } else if (filter === 'completed') {
      filtered = allSLAs.filter(sla => sla.status === 'completed');
    }

    // Ordenar: activos primero, luego por fecha de inicio
    filtered.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return b.startTime - a.startTime;
    });

    setSlas(filtered);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este SLA?')) {
      deleteSLA(id);
      loadSLAs();
    }
  };

  const handleEdit = (sla: SLA, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt('Editar nombre:', sla.name);
    if (newName && newName.trim()) {
      const updated = { ...sla, name: newName.trim() };
      saveSLA(updated);
      loadSLAs();
    }
  };

  const getRemainingTime = (sla: SLA): string => {
    if (sla.status === 'completed') return '';
    
    const duration = getSLADuration(sla);
    const isBusinessDays = isBusinessDaysType(sla.sopId, sla.type);
    const elapsed = calculateElapsedTime(sla.startTime, Date.now(), isBusinessDays);
    const remaining = duration - elapsed;
    
    // Si el tiempo está excedido, mostrar "Tiempo excedido"
    if (remaining < 0) return 'Tiempo excedido';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h`;
    return '<1h';
  };

  const isOverdue = (sla: SLA): boolean => {
    if (sla.status !== 'completed' || !sla.endTime) return false;
    
    const duration = getSLADuration(sla);
    const isBusinessDays = isBusinessDaysType(sla.sopId, sla.type);
    const elapsed = calculateElapsedTime(sla.startTime, sla.endTime, isBusinessDays);
    return elapsed > duration;
  };

  const getProgress = (sla: SLA): number => {
    if (sla.status === 'completed') return 0;
    
    const duration = getSLADuration(sla);
    const isBusinessDays = isBusinessDaysType(sla.sopId, sla.type);
    const elapsed = calculateElapsedTime(sla.startTime, Date.now(), isBusinessDays);
    const progress = Math.min(1, elapsed / duration);
    
    return progress;
  };

  const getProgressColor = (progress: number): string => {
    if (progress <= 0.33) return '#4CAF50';
    if (progress <= 0.66) return '#FFC107';
    return '#F44336';
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ fontSize: '14px', padding: '8px 16px' }}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('active')}
          className={filter === 'active' ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ fontSize: '14px', padding: '8px 16px' }}
        >
          Activos
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ fontSize: '14px', padding: '8px 16px' }}
        >
          Terminados
        </button>
      </div>

      {slas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#999' }}>No hay SLA's {filter !== 'all' ? filter === 'active' ? 'activos' : 'terminados' : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {slas.map((sla) => {
            const progress = getProgress(sla);
            const progressColor = getProgressColor(progress);
            const remainingTime = getRemainingTime(sla);
            const overdue = isOverdue(sla);
            
            // Determinar estado según si está activo/completado y si está vencido
            let statusText = '';
            let statusColor = '';
            let statusBackground = '';
            
            if (sla.status === 'active') {
              const duration = getSLADuration(sla);
              const isBusinessDays = isBusinessDaysType(sla.sopId, sla.type);
              const now = Date.now();
              const elapsed = calculateElapsedTime(sla.startTime, now, isBusinessDays);
              const isActiveOverdue = elapsed > duration;
              
              if (isActiveOverdue) {
                statusText = 'Activo vencido';
                statusColor = '#FF9800';
                statusBackground = '#FFF5F0';
              } else {
                statusText = 'Activo en tiempo';
                statusColor = '#FF6B35';
                statusBackground = '#FFF5F0';
              }
            } else {
              if (overdue) {
                statusText = 'Terminado vencido';
                statusColor = '#F44336';
                statusBackground = '#FFEBEE';
              } else {
                statusText = 'Terminado en tiempo';
                statusColor = '#4CAF50';
                statusBackground = '#F0F9F0';
              }
            }

            return (
              <div
                key={sla.id}
                onClick={() => onSlaClick(sla)}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  border: `2px solid ${sla.status === 'active' ? '#FF6B35' : overdue ? '#F44336' : '#6B6B6B'}`,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      color: sla.status === 'active' ? '#FF6B35' : overdue ? '#F44336' : '#6B6B6B',
                      margin: 0,
                      marginBottom: '8px',
                      fontSize: '18px'
                    }}>
                      {sla.name}
                    </h3>
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: statusBackground,
                        color: statusColor
                      }}>
                        {statusText}
                      </span>
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        Tipo {sla.type}
                      </span>
                      {remainingTime && (
                        <span style={{ 
                          color: remainingTime === 'Tiempo excedido' ? '#F44336' : progressColor, 
                          fontSize: '14px', 
                          fontWeight: '600' 
                        }}>
                          {remainingTime === 'Tiempo excedido' ? remainingTime : `${remainingTime} restantes`}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#6B6B6B',
                      marginBottom: '8px'
                    }}>
                      <div><strong>Inicio:</strong> {sla.startDate}</div>
                      <div><strong>Fin:</strong> {
                        (() => {
                          const duration = getSLADuration(sla);
                          const endTime = sla.startTime + duration;
                          const endDate = new Date(endTime);
                          const day = endDate.getDate().toString().padStart(2, '0');
                          const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
                          const year = endDate.getFullYear();
                          const hours = endDate.getHours().toString().padStart(2, '0');
                          const minutes = endDate.getMinutes().toString().padStart(2, '0');
                          return `${day}/${month}/${year} ${hours}:${minutes}`;
                        })()
                      }</div>
                    </div>
                    {(sla.asignacion || sla.encargado) && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        {sla.asignacion && (
                          <span>
                            <strong>Asignación:</strong> {sla.asignacion}
                          </span>
                        )}
                        {sla.encargado && (
                          <span>
                            <strong>Encargado:</strong> {sla.encargado}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => handleEdit(sla, e)}
                      style={{
                        padding: '6px 12px',
                        background: '#6B6B6B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => handleDelete(sla.id, e)}
                      style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {sla.status === 'active' && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progress * 100}%`,
                        height: '100%',
                        backgroundColor: progressColor,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

