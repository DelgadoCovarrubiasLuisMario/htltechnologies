'use client';

import { useRef, useEffect, useState } from 'react';
import { SLA, getSLADuration, isBusinessDaysType, calculateElapsedTime } from '@/app/types/sla';
import { getSLAsBySOP } from '@/app/utils/slaStorage';

interface SLATrackingChartProps {
  sopId: string;
  sopTitle?: string;
}

type FilterType = 'vencidos' | 'terminados' | 'activos';

export default function SLATrackingChart({ sopId, sopTitle }: SLATrackingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [filters, setFilters] = useState<Record<FilterType, boolean>>({
    vencidos: true,
    terminados: true,
    activos: true,
  });
  const [stats, setStats] = useState({
    vencidos: 0,
    terminados: 0,
    activos: 0,
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
    
    let vencidos = 0;
    let terminados = 0;
    let activos = 0;

    slas.forEach((sla) => {
      if (sla.status === 'active') {
        activos++;
      } else if (sla.status === 'completed' && sla.endTime) {
        const duration = getSLADuration(sla);
        const isBusinessDays = isBusinessDaysType(sla.sopId, sla.type);
        const elapsed = calculateElapsedTime(sla.startTime, sla.endTime, isBusinessDays);
        if (elapsed > duration) {
          vencidos++;
        } else {
          terminados++;
        }
      }
    });

    setStats({ vencidos, terminados, activos });
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
    if (filters.vencidos) {
      data.push({ label: 'Vencidos', value: stats.vencidos, color: '#F44336' });
    }
    if (filters.terminados) {
      data.push({ label: 'Terminados en tiempo', value: stats.terminados, color: '#4CAF50' });
    }
    if (filters.activos) {
      data.push({ label: 'Activos', value: stats.activos, color: '#6B6B6B' });
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
    const chartHeight = height - 180;
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

    // Leyenda - centrada y mejor formateada (sin duplicados)
    const legendY = height - 50;
    const legendStartX = width / 2;
    const legendItemWidth = 220;
    const totalLegendWidth = data.length * legendItemWidth;
    
    data.forEach((item, index) => {
      const itemX = legendStartX - totalLegendWidth / 2 + (index * legendItemWidth) + legendItemWidth / 2;
      
      // Cuadro de color más grande y con borde
      ctx.fillStyle = item.color;
      ctx.fillRect(itemX - 90, legendY - 12, 28, 20);
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(itemX - 90, legendY - 12, 28, 20);
      
      // Texto centrado - acortar "Terminados en tiempo" si es necesario
      let labelText = item.label;
      if (labelText === 'Terminados en tiempo') {
        labelText = 'Terminados';
      }
      
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, itemX, legendY + 5);
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
            background: filters.vencidos ? '#FFF5F0' : '#F5F5F5',
            borderRadius: '8px',
            border: `2px solid ${filters.vencidos ? '#FF6B35' : '#E0E0E0'}`,
            transition: 'all 0.3s ease'
          }}>
            <input
              type="checkbox"
              checked={filters.vencidos}
              onChange={() => handleFilterToggle('vencidos')}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: '#333', fontWeight: filters.vencidos ? '600' : '400' }}>
              Vencidos ({stats.vencidos})
            </span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px 16px',
            background: filters.terminados ? '#F0F9F0' : '#F5F5F5',
            borderRadius: '8px',
            border: `2px solid ${filters.terminados ? '#4CAF50' : '#E0E0E0'}`,
            transition: 'all 0.3s ease'
          }}>
            <input
              type="checkbox"
              checked={filters.terminados}
              onChange={() => handleFilterToggle('terminados')}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: '#333', fontWeight: filters.terminados ? '600' : '400' }}>
              Terminados en tiempo ({stats.terminados})
            </span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px 16px',
            background: filters.activos ? '#F5F5F5' : '#F5F5F5',
            borderRadius: '8px',
            border: `2px solid ${filters.activos ? '#6B6B6B' : '#E0E0E0'}`,
            transition: 'all 0.3s ease'
          }}>
            <input
              type="checkbox"
              checked={filters.activos}
              onChange={() => handleFilterToggle('activos')}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: '#333', fontWeight: filters.activos ? '600' : '400' }}>
              Activos ({stats.activos})
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

