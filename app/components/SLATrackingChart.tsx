'use client';

import { useRef, useEffect, useState } from 'react';
import { SLA, getSLADuration, isBusinessDaysType, calculateElapsedTime } from '@/app/types/sla';
import { getSLAsBySOP } from '@/app/utils/slaStorage';

interface SLATrackingChartProps {
  sopId: string;
  sopTitle?: string;
}

type FilterType = 'terminados-vencidos' | 'terminados-tiempo' | 'activos-vencidos' | 'activos-tiempo';

export default function SLATrackingChart({ sopId, sopTitle }: SLATrackingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [filters, setFilters] = useState<Record<FilterType, boolean>>({
    'terminados-vencidos': true,
    'terminados-tiempo': true,
    'activos-vencidos': true,
    'activos-tiempo': true,
  });
  const [stats, setStats] = useState({
    'terminados-vencidos': 0,
    'terminados-tiempo': 0,
    'activos-vencidos': 0,
    'activos-tiempo': 0,
  });

  useEffect(() => {
    calculateStats();
  }, [sopId]);

  useEffect(() => {
    if (canvasRef.current) {
      generateChart();
    }
  }, [stats, filters]);

  const calculateStats = () => {
    const slas = getSLAsBySOP(sopId);
    
    let terminadosVencidos = 0;
    let terminadosTiempo = 0;
    let activosVencidos = 0;
    let activosTiempo = 0;

    slas.forEach((sla) => {
      const duration = getSLADuration(sla);
      const isBusinessDays = isBusinessDaysType(sla.sopId, sla.type);
      
      if (sla.status === 'active') {
        const now = Date.now();
        const elapsed = calculateElapsedTime(sla.startTime, now, isBusinessDays);
        if (elapsed > duration) {
          activosVencidos++;
        } else {
          activosTiempo++;
        }
      } else if (sla.status === 'completed' && sla.endTime) {
        const elapsed = calculateElapsedTime(sla.startTime, sla.endTime, isBusinessDays);
        if (elapsed > duration) {
          terminadosVencidos++;
        } else {
          terminadosTiempo++;
        }
      }
    });

    setStats({ 
      'terminados-vencidos': terminadosVencidos,
      'terminados-tiempo': terminadosTiempo,
      'activos-vencidos': activosVencidos,
      'activos-tiempo': activosTiempo
    });
  };

  const generateChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 700;
    const height = 450;
    canvas.width = width;
    canvas.height = height;

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Título
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Seguimiento y medición del cumplimiento del SLA', width / 2, 40);
    
    // Área (SOP) debajo del título
    if (sopTitle) {
      ctx.fillStyle = '#6B6B6B';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(sopTitle, width / 2, 65);
    }

    // Calcular datos filtrados
    const data: { label: string; value: number; color: string }[] = [];
    if (filters['terminados-vencidos']) {
      data.push({ label: 'Terminados vencidos', value: stats['terminados-vencidos'], color: '#F44336' });
    }
    if (filters['terminados-tiempo']) {
      data.push({ label: 'Terminados en tiempo', value: stats['terminados-tiempo'], color: '#4CAF50' });
    }
    if (filters['activos-vencidos']) {
      data.push({ label: 'Activos vencidos', value: stats['activos-vencidos'], color: '#FF9800' });
    }
    if (filters['activos-tiempo']) {
      data.push({ label: 'Activos en tiempo', value: stats['activos-tiempo'], color: '#6B6B6B' });
    }

    if (data.length === 0) {
      // Mostrar mensaje si no hay datos
      ctx.fillStyle = '#999999';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos para mostrar con los filtros seleccionados', width / 2, height / 2);
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
      return;
    }

    // Configuración de la gráfica
    const chartX = 80;
    const chartY = sopTitle ? 110 : 100;
    const chartWidth = width - 160;
    const chartHeight = height - 200; // Más espacio para la leyenda en doble línea
    const barWidth = chartWidth / data.length;
    const maxValue = Math.max(...data.map(d => d.value));
    const barSpacing = barWidth * 0.2;

    // Dibujar ejes
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    // Eje Y (vertical)
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.stroke();
    // Eje X (horizontal)
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.stroke();

    // Dibujar barras
    data.forEach((item, index) => {
      const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
      const barX = chartX + (index * barWidth) + barSpacing / 2;
      const barY = chartY + chartHeight - barHeight;

      // Dibujar barra
      ctx.fillStyle = item.color;
      ctx.fillRect(barX, barY, barWidth - barSpacing, barHeight);

      // Valor sobre la barra
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), barX + (barWidth - barSpacing) / 2, barY - 10);
    });

    // Leyenda - centrada y mejor formateada con texto en doble línea
    const legendY = height - 60;
    const legendStartX = width / 2;
    const legendItemWidth = 160;
    const totalLegendWidth = data.length * legendItemWidth;
    
    data.forEach((item, index) => {
      const itemX = legendStartX - totalLegendWidth / 2 + (index * legendItemWidth) + legendItemWidth / 2;
      
      // Cuadro de color más grande y con borde
      ctx.fillStyle = item.color;
      ctx.fillRect(itemX - 70, legendY - 12, 24, 18);
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(itemX - 70, legendY - 12, 24, 18);
      
       // Texto centrado en doble línea si es necesario
       const labelText = item.label;
       
       ctx.fillStyle = '#333333';
       ctx.font = 'bold 12px Arial';
       ctx.textAlign = 'center';
       
       // Caso especial para "Activos vencidos"
       if (labelText === 'Activos vencidos') {
         ctx.fillText('Vencidos', itemX, legendY + 3);
         ctx.fillText('activos', itemX, legendY + 18);
       } else {
         const words = labelText.split(' ');
         const maxWidth = 120;
         
         // Dividir en dos líneas si es necesario
         if (words.length > 2 || ctx.measureText(labelText).width > maxWidth) {
           // Dividir en dos líneas
           const midPoint = Math.ceil(words.length / 2);
           const line1 = words.slice(0, midPoint).join(' ');
           const line2 = words.slice(midPoint).join(' ');
           
           ctx.fillText(line1, itemX, legendY + 3);
           ctx.fillText(line2, itemX, legendY + 18);
         } else {
           ctx.fillText(labelText, itemX, legendY + 10);
         }
       }
    });

    // Convertir canvas a imagen
    const dataUrl = canvas.toDataURL('image/png');
    setImageUrl(dataUrl);
  };

  const handleFilterToggle = (filter: FilterType) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.download = `Seguimiento_SLA_${Date.now()}.png`;
      link.href = imageUrl;
      link.click();
    }
  };

  // Actualizar estadísticas cada segundo para tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      calculateStats();
    }, 1000);

    return () => clearInterval(interval);
  }, [sopId]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          color: '#FF6B35', 
          marginBottom: '20px',
          fontSize: '20px'
        }}>
          Filtros
        </h2>
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px 16px',
            background: filters['terminados-vencidos'] ? '#FFEBEE' : '#F5F5F5',
            borderRadius: '8px',
            border: `2px solid ${filters['terminados-vencidos'] ? '#F44336' : '#E0E0E0'}`,
            transition: 'all 0.3s ease'
          }}>
            <input
              type="checkbox"
              checked={filters['terminados-vencidos']}
              onChange={() => handleFilterToggle('terminados-vencidos')}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: '#333', fontWeight: filters['terminados-vencidos'] ? '600' : '400' }}>
              Terminados vencidos ({stats['terminados-vencidos']})
            </span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px 16px',
            background: filters['terminados-tiempo'] ? '#F0F9F0' : '#F5F5F5',
            borderRadius: '8px',
            border: `2px solid ${filters['terminados-tiempo'] ? '#4CAF50' : '#E0E0E0'}`,
            transition: 'all 0.3s ease'
          }}>
            <input
              type="checkbox"
              checked={filters['terminados-tiempo']}
              onChange={() => handleFilterToggle('terminados-tiempo')}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: '#333', fontWeight: filters['terminados-tiempo'] ? '600' : '400' }}>
              Terminados en tiempo ({stats['terminados-tiempo']})
            </span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px 16px',
            background: filters['activos-vencidos'] ? '#FFF5F0' : '#F5F5F5',
            borderRadius: '8px',
            border: `2px solid ${filters['activos-vencidos'] ? '#FF9800' : '#E0E0E0'}`,
            transition: 'all 0.3s ease'
          }}>
            <input
              type="checkbox"
              checked={filters['activos-vencidos']}
              onChange={() => handleFilterToggle('activos-vencidos')}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: '#333', fontWeight: filters['activos-vencidos'] ? '600' : '400' }}>
              Activos vencidos ({stats['activos-vencidos']})
            </span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px 16px',
            background: filters['activos-tiempo'] ? '#F5F5F5' : '#F5F5F5',
            borderRadius: '8px',
            border: `2px solid ${filters['activos-tiempo'] ? '#6B6B6B' : '#E0E0E0'}`,
            transition: 'all 0.3s ease'
          }}>
            <input
              type="checkbox"
              checked={filters['activos-tiempo']}
              onChange={() => handleFilterToggle('activos-tiempo')}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: '#333', fontWeight: filters['activos-tiempo'] ? '600' : '400' }}>
              Activos en tiempo ({stats['activos-tiempo']})
            </span>
          </label>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {imageUrl && (
          <>
            <img 
              src={imageUrl} 
              alt="Gráfica de seguimiento SLA"
              style={{
                maxWidth: '500px',
                width: '100%',
                border: '2px solid #FF6B35',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
            <button
              onClick={handleDownload}
              className="btn btn-primary"
              style={{ 
                minWidth: '200px',
                padding: '12px 24px',
                fontSize: '16px'
              }}
            >
              Descargar Gráfica
            </button>
          </>
        )}
      </div>
    </div>
  );
}

