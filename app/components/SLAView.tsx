'use client';

import { useState, useEffect } from 'react';
import { SLA, getSLADuration, Subtask } from '@/app/types/sla';
import { saveSLA, getSLAById } from '@/app/utils/slaStorage';
import SLATimer from './SLATimer';
import SLAReportImage from './SLAReportImage';

interface SLAViewProps {
  sla: SLA;
  sopTitle?: string;
  onBack: () => void;
  onUpdate: () => void;
}

export default function SLAView({ sla: initialSla, sopTitle, onBack, onUpdate }: SLAViewProps) {
  const [sla, setSla] = useState<SLA>(initialSla);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comments, setComments] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState(sla.name);
  const [editingAsignacion, setEditingAsignacion] = useState(false);
  const [editedAsignacion, setEditedAsignacion] = useState(sla.asignacion || '');
  const [editingEncargado, setEditingEncargado] = useState(false);
  const [editedEncargado, setEditedEncargado] = useState(sla.encargado || '');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Actualizar SLA cuando cambie desde fuera
  useEffect(() => {
    const updated = getSLAById(initialSla.id);
    if (updated) {
      setSla(updated);
      setEditedName(updated.name);
      setEditedAsignacion(updated.asignacion || '');
      setEditedEncargado(updated.encargado || '');
    } else {
      setSla(initialSla);
      setEditedName(initialSla.name);
      setEditedAsignacion(initialSla.asignacion || '');
      setEditedEncargado(initialSla.encargado || '');
    }
  }, [initialSla]);

  // Escuchar cambios en el storage para actualizar automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = getSLAById(sla.id);
      if (updated) {
        // Solo actualizar si hay cambios en timeAdjustment u otros campos importantes
        if (updated.timeAdjustment !== sla.timeAdjustment || 
            updated.status !== sla.status ||
            updated.name !== sla.name ||
            updated.asignacion !== sla.asignacion ||
            updated.encargado !== sla.encargado ||
            JSON.stringify(updated.subtasks) !== JSON.stringify(sla.subtasks)) {
          setSla(updated);
          setEditedName(updated.name);
          setEditedAsignacion(updated.asignacion || '');
          setEditedEncargado(updated.encargado || '');
        }
      }
    }, 500); // Verificar cada 500ms

    return () => clearInterval(interval);
  }, [sla.id, sla.timeAdjustment, sla.status, sla.name, sla.asignacion, sla.encargado, sla.subtasks]);

  // Verificar si todas las subtareas están completadas y abrir modal de comentarios
  useEffect(() => {
    if (sla.status === 'active' && sla.subtasks && sla.subtasks.length > 0 && !showCommentModal) {
      const allCompleted = sla.subtasks.every(subtask => subtask.completed);
      
      // Solo abrir el modal si todas están completadas y el modal no está abierto
      if (allCompleted) {
        // Abrir modal de comentarios cuando todas las subtareas estén completadas
        setShowCommentModal(true);
      }
    }
  }, [sla.subtasks, sla.status, sla.id, showCommentModal]);

  const handleComplete = () => {
    setShowCommentModal(true);
  };

  const handleSaveComments = () => {
    const updated: SLA = {
      ...sla,
      status: 'completed',
      endTime: Date.now(),
      comments: comments.trim() || undefined,
      startDate: sla.startDate,
      endDate: sla.endDate
    };
    saveSLA(updated);
    setSla(updated);
    setShowCommentModal(false);
    setComments('');
    onUpdate();
  };

  const handleSaveAsignacion = () => {
    const updated = { ...sla, asignacion: editedAsignacion.trim() || undefined };
    saveSLA(updated);
    setSla(updated);
    setEditingAsignacion(false);
    onUpdate();
  };

  const handleSaveEncargado = () => {
    const updated = { ...sla, encargado: editedEncargado.trim() || undefined };
    saveSLA(updated);
    setSla(updated);
    setEditingEncargado(false);
    onUpdate();
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      const updated = { ...sla, name: editedName.trim() };
      saveSLA(updated);
      setSla(updated);
      setEditingName(false);
      onUpdate();
    }
  };

  if (sla.status === 'completed') {
    return (
      <div>
        <button onClick={onBack} className="back-button">
          ← Volver al Historial
        </button>
        
        <div className="card">
          <div style={{ marginBottom: '20px' }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="input"
                  style={{ flex: 1, marginBottom: 0 }}
                />
                <button onClick={handleSaveName} className="btn btn-primary">
                  Guardar
                </button>
                <button 
                  onClick={() => {
                    setEditingName(false);
                    setEditedName(sla.name);
                  }} 
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div>
                <h1 style={{ 
                  color: '#FF6B35', 
                  marginBottom: '12px',
                  fontSize: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {sla.name}
                  <button
                    onClick={() => setEditingName(true)}
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
                </h1>
                <div style={{ 
                  fontSize: '13px',
                  color: '#6B6B6B',
                  marginBottom: '12px'
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
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                flexWrap: 'wrap',
                fontSize: '14px',
                color: '#666',
                marginBottom: '16px'
              }}>
                {editingAsignacion ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editedAsignacion}
                      onChange={(e) => setEditedAsignacion(e.target.value)}
                      placeholder="Asignación"
                      style={{
                        padding: '6px 10px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '150px'
                      }}
                    />
                    <button onClick={handleSaveAsignacion} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Guardar
                    </button>
                    <button 
                      onClick={() => {
                        setEditingAsignacion(false);
                        setEditedAsignacion(sla.asignacion || '');
                      }} 
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <strong style={{ color: '#333' }}>Asignación:</strong> 
                    <span>{sla.asignacion || 'Sin asignación'}</span>
                    <button
                      onClick={() => setEditingAsignacion(true)}
                      style={{
                        padding: '4px 8px',
                        background: '#6B6B6B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      Editar
                    </button>
                  </div>
                )}
                {editingEncargado ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editedEncargado}
                      onChange={(e) => setEditedEncargado(e.target.value)}
                      placeholder="Encargado"
                      style={{
                        padding: '6px 10px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '150px'
                      }}
                    />
                    <button onClick={handleSaveEncargado} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Guardar
                    </button>
                    <button 
                      onClick={() => {
                        setEditingEncargado(false);
                        setEditedEncargado(sla.encargado || '');
                      }} 
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <strong style={{ color: '#333' }}>Encargado:</strong> 
                    <span>{sla.encargado || 'Sin encargado'}</span>
                    <button
                      onClick={() => setEditingEncargado(true)}
                      style={{
                        padding: '4px 8px',
                        background: '#6B6B6B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <SLAReportImage sla={sla} sopTitle={sopTitle} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="back-button">
        ← Volver al Historial
      </button>

      <div className="card" style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
        <div style={{ marginBottom: '12px' }}>
          {editingName ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="input"
                style={{ flex: 1, marginBottom: 0, fontSize: '14px', padding: '6px' }}
              />
              <button onClick={handleSaveName} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                Guardar
              </button>
              <button 
                onClick={() => {
                  setEditingName(false);
                  setEditedName(sla.name);
                }} 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div>
              <h1 style={{ 
                color: '#FF6B35', 
                marginBottom: '8px',
                fontSize: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {sla.name}
                <button
                  onClick={() => setEditingName(true)}
                  style={{
                    padding: '4px 8px',
                    background: '#6B6B6B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Editar
                </button>
              </h1>
              <div style={{ 
                fontSize: '11px',
                color: '#6B6B6B',
                marginBottom: '8px',
                display: 'flex',
                gap: '12px'
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
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                flexWrap: 'wrap',
                fontSize: '12px',
                color: '#666',
                marginBottom: '12px'
              }}>
                {editingAsignacion ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editedAsignacion}
                      onChange={(e) => setEditedAsignacion(e.target.value)}
                      placeholder="Asignación"
                      style={{
                        padding: '6px 10px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '150px'
                      }}
                    />
                    <button onClick={handleSaveAsignacion} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Guardar
                    </button>
                    <button 
                      onClick={() => {
                        setEditingAsignacion(false);
                        setEditedAsignacion(sla.asignacion || '');
                      }} 
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <strong style={{ color: '#333' }}>Asignación:</strong> 
                    <span>{sla.asignacion || 'Sin asignación'}</span>
                    <button
                      onClick={() => setEditingAsignacion(true)}
                      style={{
                        padding: '4px 8px',
                        background: '#6B6B6B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      Editar
                    </button>
                  </div>
                )}
                {editingEncargado ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editedEncargado}
                      onChange={(e) => setEditedEncargado(e.target.value)}
                      placeholder="Encargado"
                      style={{
                        padding: '6px 10px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '150px'
                      }}
                    />
                    <button onClick={handleSaveEncargado} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Guardar
                    </button>
                    <button 
                      onClick={() => {
                        setEditingEncargado(false);
                        setEditedEncargado(sla.encargado || '');
                      }} 
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <strong style={{ color: '#333' }}>Encargado:</strong> 
                    <span>{sla.encargado || 'Sin encargado'}</span>
                    <button
                      onClick={() => setEditingEncargado(true)}
                      style={{
                        padding: '4px 8px',
                        background: '#6B6B6B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sistema de Subtareas */}
        {sla.status === 'active' && (
          <div style={{ marginBottom: '12px', padding: '12px', background: '#F9F9F9', borderRadius: '6px' }}>
            <h3 style={{ color: '#FF6B35', marginBottom: '10px', fontSize: '14px' }}>Subtareas</h3>
            
            {/* Lista de subtareas */}
            {sla.subtasks && sla.subtasks.length > 0 && (
              <div style={{ marginBottom: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                {sla.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px',
                      marginBottom: '4px',
                      background: subtask.completed ? '#F5F5F5' : 'white',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      textDecoration: subtask.completed ? 'line-through' : 'none',
                      opacity: subtask.completed ? 0.6 : 1
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={(e) => {
                        const updatedSubtasks = sla.subtasks?.map(st =>
                          st.id === subtask.id ? { ...st, completed: e.target.checked } : st
                        ) || [];
                        const updated = { ...sla, subtasks: updatedSubtasks };
                        saveSLA(updated);
                        setSla(updated);
                        onUpdate();
                      }}
                      disabled={subtask.completed}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: subtask.completed ? 'not-allowed' : 'pointer'
                      }}
                    />
                    <span style={{
                      flex: 1,
                      color: subtask.completed ? '#999' : '#333',
                      fontSize: '12px'
                    }}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Agregar nueva subtarea */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                    const newSubtask: Subtask = {
                      id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      title: newSubtaskTitle.trim(),
                      completed: false
                    };
                    const updatedSubtasks = [...(sla.subtasks || []), newSubtask];
                    const updated = { ...sla, subtasks: updatedSubtasks };
                    saveSLA(updated);
                    setSla(updated);
                    setNewSubtaskTitle('');
                    onUpdate();
                  }
                }}
                placeholder="Agregar nueva subtarea..."
                className="input"
                style={{ flex: 1, marginBottom: 0, fontSize: '12px', padding: '6px' }}
              />
              <button
                onClick={() => {
                  if (newSubtaskTitle.trim()) {
                    const newSubtask: Subtask = {
                      id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      title: newSubtaskTitle.trim(),
                      completed: false
                    };
                    const updatedSubtasks = [...(sla.subtasks || []), newSubtask];
                    const updated = { ...sla, subtasks: updatedSubtasks };
                    saveSLA(updated);
                    setSla(updated);
                    setNewSubtaskTitle('');
                    onUpdate();
                  }
                }}
                className="btn btn-primary"
                style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}
              >
                Agregar
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <SLATimer 
            sla={sla} 
            onUpdate={() => {
              const updated = getSLAById(sla.id);
              if (updated) {
                setSla(updated);
              }
              onUpdate();
            }} 
          />
        </div>

        <button
          onClick={handleComplete}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '8px', padding: '10px', fontSize: '14px' }}
        >
          Terminar SLA
        </button>
      </div>

      {showCommentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
            <h2 style={{ color: '#FF6B35', marginBottom: '20px' }}>Comentarios</h2>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ingresa tus comentarios sobre este SLA..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSaveComments}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Aceptar
              </button>
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setComments('');
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

