'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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

export default function SOPDetailPage() {
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
          onClick={() => router.push('/dashboard')}
          className="back-button"
        >
          ← Volver al Menú Principal
        </button>

        <h1 className="title" style={{ fontSize: '28px', marginBottom: '32px' }}>
          {sopTitle}
        </h1>

      <div className="submenu-grid">
        <Link href={`/dashboard/sop/${sopId}/slas`} prefetch={false}>
          <div className="submenu-item">
            <h3>SLA's</h3>
            <p style={{ marginTop: '8px', opacity: 0.9 }}>Service Level Agreements</p>
          </div>
        </Link>

        <Link href={`/dashboard/sop/${sopId}/kpis`} prefetch={false}>
          <div className="submenu-item">
            <h3>KPI's</h3>
            <p style={{ marginTop: '8px', opacity: 0.9 }}>Key Performance Indicators</p>
          </div>
        </Link>
      </div>
      </div>
    </div>
  );
}

