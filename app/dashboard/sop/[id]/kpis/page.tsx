'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import HeaderLogo from '@/app/components/HeaderLogo';

const SOP_MENU_ITEMS: { [key: string]: string } = {
  '1': 'SOP 1-Cotizaciones (distribución, proyectos y compuestos)',
  '2': 'SOP 2-Requisiciones',
  '3': 'SOP 3-Control de materiales para proyecto',
  '4': 'SOP 4-Préstamo de equipo',
  '5': 'SOP 5-Soporte de servicios',
  '6': 'SOP 6-Ciclo de proyectos',
  '7': 'SOP 7-Fabricación de partes con proveedores',
  '8': 'SOP 8-Ensamble en systems integration',
  '9': 'SOP 9-Puesta en marcha (Commisioning)',
  '10': 'SOP 10-Diseño',
  '11': 'SOP 11-Ventas',
  '12': 'SOP 12-Tráfico y logística',
};

export default function KPIsPage() {
  const router = useRouter();
  const params = useParams();
  const sopId = params?.id as string;

  // Verificar autenticación solo una vez
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('authenticated');
      if (authStatus !== 'true') {
        router.push('/login');
      }
    }
  }, [router]);

  const sopTitle = SOP_MENU_ITEMS[sopId] || 'SOP Desconocido';

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <HeaderLogo />
      
      <div className="container container-with-logo">
        <button 
          onClick={() => router.push(`/dashboard/sop/${sopId}`)}
          className="back-button"
        >
          ← Volver a {sopTitle}
        </button>

        <div className="card">
        <h1 style={{ 
          color: '#FF6B35', 
          marginBottom: '16px',
          fontSize: '24px'
        }}>
          {sopTitle} - KPI's
        </h1>
        
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <p>Contenido de KPI's próximamente...</p>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>
            Aquí se mostrarán los Key Performance Indicators para este SOP
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

