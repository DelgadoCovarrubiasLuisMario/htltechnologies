'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SLA } from '@/app/types/sla';
import { getSLAById } from '@/app/utils/slaStorage';
import HeaderLogo from '@/app/components/HeaderLogo';
import NewSLAForm from '@/app/components/NewSLAForm';
import SLAHistory from '@/app/components/SLAHistory';
import SLAView from '@/app/components/SLAView';
import SLATrackingChart from '@/app/components/SLATrackingChart';

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

type TabType = 'tracking' | 'history' | 'new';

export default function SLAsPage() {
  const router = useRouter();
  const params = useParams();
  const sopId = params?.id as string;
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [selectedSLA, setSelectedSLA] = useState<SLA | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleSlaClick = (sla: SLA) => {
    setSelectedSLA(sla);
  };

  const handleBack = () => {
    setSelectedSLA(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleNewSLASaved = (slaId: string) => {
    // Cargar el SLA recién creado y mostrarlo
    const newSLA = getSLAById(slaId);
    if (newSLA) {
      setSelectedSLA(newSLA);
    } else {
      setActiveTab('history');
      setRefreshKey(prev => prev + 1);
    }
  };

  if (selectedSLA) {
    // Recargar el SLA actualizado cuando se actualiza
    const handleUpdate = () => {
      const updated = getSLAById(selectedSLA.id);
      if (updated) {
        setSelectedSLA(updated);
      }
      setRefreshKey(prev => prev + 1);
    };

    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <HeaderLogo />
        <div className="container container-with-logo">
          <SLAView 
            sla={selectedSLA}
            sopTitle={sopTitle}
            onBack={handleBack}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    );
  }

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
          marginBottom: '24px',
          fontSize: '24px'
        }}>
          {sopTitle} - SLA's
        </h1>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '24px',
          borderBottom: '2px solid #e0e0e0',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'history' ? '3px solid #FF6B35' : '3px solid transparent',
                color: activeTab === 'history' ? '#FF6B35' : '#666',
                fontWeight: activeTab === 'history' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
            >
              Historial
            </button>
            <button
              onClick={() => setActiveTab('new')}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'new' ? '3px solid #FF6B35' : '3px solid transparent',
                color: activeTab === 'new' ? '#FF6B35' : '#666',
                fontWeight: activeTab === 'new' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
            >
              Nuevo SLA
            </button>
          </div>
          <button
            onClick={() => setActiveTab('tracking')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tracking' ? '3px solid #FF6B35' : '3px solid transparent',
              color: activeTab === 'tracking' ? '#FF6B35' : '#666',
              fontWeight: activeTab === 'tracking' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Seguimiento y medición del cumplimiento del SLA
          </button>
        </div>

        {/* Content */}
        {activeTab === 'tracking' ? (
          <SLATrackingChart sopId={sopId} sopTitle={sopTitle} />
        ) : activeTab === 'history' ? (
          <SLAHistory 
            key={refreshKey}
            sopId={sopId} 
            onSlaClick={handleSlaClick}
          />
        ) : (
          <NewSLAForm 
            sopId={sopId} 
            onSave={handleNewSLASaved}
          />
        )}
      </div>
      </div>
    </div>
  );
}

