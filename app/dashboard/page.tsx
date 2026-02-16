'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useEffect, useState } from 'react';
import HeaderLogo from '@/app/components/HeaderLogo';
import SLATrackingChartGlobal from '@/app/components/SLATrackingChartGlobal';
import { getAllSLAs, getSLAsBySOP } from '@/app/utils/slaStorage';
import { getSLADuration, isBusinessDaysType, calculateElapsedTime } from '@/app/types/sla';

const SOP_MENU_ITEMS = [
  { id: 1, title: 'SOP 1-Cotizaciones (distribución, proyectos y compuestos)' },
  { id: 2, title: 'SOP 2-Requisiciones' },
  { id: 3, title: 'SOP 3-Control de materiales para proyecto' },
  { id: 4, title: 'SOP 4-Préstamo de equipo' },
  { id: 5, title: 'SOP 5-Soporte de servicios' },
  { id: 6, title: 'SOP 6-Ciclo de proyectos' },
  { id: 7, title: 'SOP 7-Fabricación de partes con proveedores' },
  { id: 8, title: 'SOP 8-Ensamble en systems integration' },
  { id: 9, title: 'SOP 9-Puesta en marcha (Commisioning)' },
  { id: 10, title: 'SOP 10-Diseño' },
  { id: 11, title: 'SOP 11-Ventas' },
  { id: 12, title: 'SOP 12-Tráfico y logística' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [showGlobalChart, setShowGlobalChart] = useState(false);
  const [slaCounts, setSlaCounts] = useState<Record<number, { active: number; completed: number }>>({});

  // Verificar autenticación solo una vez al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('authenticated');
      if (authStatus !== 'true') {
        router.push('/login');
      }
    }
  }, [router]);

  // Calcular contadores de SLA por departamento
  useEffect(() => {
    const calculateCounts = () => {
      const counts: Record<number, { active: number; completed: number }> = {};
      
      SOP_MENU_ITEMS.forEach((item) => {
        const slas = getSLAsBySOP(item.id.toString());
        const active = slas.filter(sla => sla.status === 'active').length;
        const completed = slas.filter(sla => sla.status === 'completed').length;
        counts[item.id] = { active, completed };
      });
      
      setSlaCounts(counts);
    };

    calculateCounts();
    // Actualizar cada 5 segundos
    const interval = setInterval(calculateCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('username');
    router.push('/login');
  };

  const menuItems = useMemo(() => SOP_MENU_ITEMS, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <HeaderLogo />
      
      <div className="container dashboard-container">
        <h1 className="title" style={{ margin: 0, fontSize: '28px', marginBottom: '32px' }}>
          HTL Electronics - Tablero de medición
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="menu-grid">
            {menuItems.map((item) => {
              const counts = slaCounts[item.id] || { active: 0, completed: 0 };
              return (
                <Link key={item.id} href={`/dashboard/sop/${item.id}`} prefetch={false}>
                  <div className="menu-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <h3 style={{ margin: 0, flex: 1 }}>{item.title}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {counts.active > 0 && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#FFF5F0',
                            padding: '4px 8px',
                            borderRadius: '12px'
                          }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: '#FF6B35'
                            }}></div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{counts.active}</span>
                          </div>
                        )}
                        {counts.completed > 0 && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#F5F5F5',
                            padding: '4px 8px',
                            borderRadius: '12px'
                          }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: '#6B6B6B'
                            }}></div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{counts.completed}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Leyenda de colores - abajo a la izquierda */}
          <div style={{
            padding: '12px 16px',
            background: '#F5F5F5',
            borderRadius: '8px',
            display: 'inline-block',
            fontSize: '13px',
            alignSelf: 'flex-start'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#FF6B35'
                }}></div>
                <span style={{ color: '#333' }}>SLA's Activos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#6B6B6B'
                }}></div>
                <span style={{ color: '#333' }}>SLA's Terminados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón para mostrar gráfica global */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setShowGlobalChart(true)}
            className="btn btn-primary"
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: '600'
            }}
          >
            Seguimiento y medición del cumplimiento del SLA (Global)
          </button>
        </div>
      </div>

      {/* Modal con gráfica global */}
      {showGlobalChart && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
          overflow: 'auto'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowGlobalChart(false);
          }
        }}
        >
          <div className="card" style={{
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowGlobalChart(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#6B6B6B',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                zIndex: 10
              }}
            >
              ×
            </button>
            <SLATrackingChartGlobal />
          </div>
        </div>
      )}

      <button 
        onClick={handleLogout}
        className="btn btn-secondary"
        style={{ 
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          fontSize: '14px', 
          padding: '10px 20px',
          zIndex: 10
        }}
      >
        Cerrar Sesión
      </button>
    </div>
  );
}

