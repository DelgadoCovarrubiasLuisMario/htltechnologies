'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useEffect, useState } from 'react';
import HeaderLogo from '@/app/components/HeaderLogo';
import SLATrackingChartGlobal from '@/app/components/SLATrackingChartGlobal';

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

  // Verificar autenticación solo una vez al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('authenticated');
      if (authStatus !== 'true') {
        router.push('/login');
      }
    }
  }, [router]);

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

        <div className="menu-grid">
          {menuItems.map((item) => (
            <Link key={item.id} href={`/dashboard/sop/${item.id}`} prefetch={false}>
              <div className="menu-item">
                <h3>{item.title}</h3>
              </div>
            </Link>
          ))}
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

