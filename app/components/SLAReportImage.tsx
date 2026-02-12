'use client';

import { useRef, useEffect, useState } from 'react';
import { SLA, getSLADuration, getSLATypeDuration, isBusinessDaysType, calculateElapsedTime } from '@/app/types/sla';

interface SLAReportImageProps {
  sla: SLA;
  sopTitle?: string;
  onDownload?: () => void;
}

export default function SLAReportImage({ sla, sopTitle, onDownload }: SLAReportImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (sla.status === 'completed' && canvasRef.current) {
      generateImage().catch(console.error);
    }
  }, [sla]);

  const generateImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 550;
    const height = 410;
    canvas.width = width;
    canvas.height = height;

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Cargar y dibujar logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/logo.jpg';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          // Dibujar logo en esquina izquierda arriba (ajustar tamaño)
          const logoWidth = 80;
          const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
          ctx.drawImage(logoImg, 20, 20, logoWidth, logoHeight);
          resolve(null);
        };
        logoImg.onerror = reject;
      });
    } catch (error) {
      // Si falla cargar el logo, usar texto como fallback
      ctx.fillStyle = '#FF6B35';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('HTL Electronics', 20, 30);
    }

    // Nombre del SLA (centro arriba, con espacio del logo)
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    // Ajustar posición para evitar amontonarse con el logo (logo está a 20px, altura ~50px, entonces empezar desde ~90px)
    ctx.fillText(sla.name, width / 2, 90);
    
    // Departamento (SOP) debajo del título en pequeño y gris
    let currentY = 115;
    if (sopTitle) {
      ctx.fillStyle = '#6B6B6B';
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(sopTitle, width / 2, currentY);
      currentY += 20;
    }

    // Calcular tiempo
    const duration = getSLADuration(sla);
    const isBusinessDays = isBusinessDaysType(sla.sopId, sla.type);
    const endTime = sla.endTime || Date.now();
    const elapsed = calculateElapsedTime(sla.startTime, endTime, isBusinessDays);
    const difference = elapsed - duration;
    const isOverdue = difference > 0;

    const hasComments = sla.comments && sla.comments.trim();
    
    // Calcular altura total del contenido para centrar si no hay comentarios
    let contentHeight = 0;
    contentHeight += 20; // espacio después del título
    contentHeight += 18; // fecha inicio
    contentHeight += 18; // fecha fin
    contentHeight += 28; // tiempo
    if (sla.asignacion) contentHeight += 22;
    if (sla.encargado) contentHeight += 22;
    
    // Si no hay comentarios, centrar verticalmente
    const startY = hasComments ? currentY : (height / 2 - contentHeight / 2 + 40);
    let drawY = startY;

    // Fechas de inicio y fin
    ctx.fillStyle = '#6B6B6B';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Inicio: ${sla.startDate}`, width / 2, drawY);
    drawY += 18;
    // Calcular fecha de fin con timeAdjustment
    const durationForEndDate = getSLADuration(sla);
    const endTimeForDate = sla.startTime + durationForEndDate;
    const endDateObj = new Date(endTimeForDate);
    const day = endDateObj.getDate().toString().padStart(2, '0');
    const month = (endDateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = endDateObj.getFullYear();
    const endHours = endDateObj.getHours().toString().padStart(2, '0');
    const endMinutes = endDateObj.getMinutes().toString().padStart(2, '0');
    const formattedEndDate = `${day}/${month}/${year} ${endHours}:${endMinutes}`;
    ctx.fillText(`Fin: ${formattedEndDate}`, width / 2, drawY);
    drawY += 25;

    // Tiempo sobrante/faltante (centrado) - sin colores, en horas y minutos redondeados
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    
    const totalMinutes = Math.round(Math.abs(difference) / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let timeText = '';
    if (hours > 0) {
      timeText = isOverdue 
        ? `Tiempo excedido: ${hours} ${hours === 1 ? 'hora' : 'horas'}${minutes > 0 ? ` ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}` : ''}`
        : `Tiempo remanente: ${hours} ${hours === 1 ? 'hora' : 'horas'}${minutes > 0 ? ` ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}` : ''}`;
    } else {
      timeText = isOverdue 
        ? `Tiempo excedido: ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
        : `Tiempo remanente: ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    ctx.fillText(timeText, width / 2, drawY);
    drawY += 28;

    // Asignación y Encargado (debajo del tiempo)
    if (sla.asignacion || sla.encargado) {
      ctx.fillStyle = '#6B6B6B';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      
      if (sla.asignacion) {
        ctx.fillText(`Asignación: ${sla.asignacion}`, width / 2, drawY);
        drawY += 22;
      }
      if (sla.encargado) {
        ctx.fillText(`Encargado: ${sla.encargado}`, width / 2, drawY);
        drawY += 22;
      }
    }

    // Comentarios (caja con borde naranja mejorada) - solo si hay comentarios
    if (hasComments) {
      currentY = drawY;
      const commentBoxX = 75;
      const commentBoxY = currentY + 10;
      const commentBoxWidth = width - 150;
      const commentBoxHeight = 160;
      
      // Fondo suave
      ctx.fillStyle = '#FFF5F0';
      ctx.fillRect(commentBoxX, commentBoxY, commentBoxWidth, commentBoxHeight);
      
      // Borde naranja
      ctx.strokeStyle = '#FF6B35';
      ctx.lineWidth = 2;
      ctx.strokeRect(commentBoxX, commentBoxY, commentBoxWidth, commentBoxHeight);
      
      // Título "Comentarios"
      ctx.fillStyle = '#FF6B35';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Comentarios:', commentBoxX + 15, commentBoxY + 25);
      
      // Texto de comentarios
      ctx.fillStyle = '#333333';
      ctx.font = '13px Arial';
      ctx.textAlign = 'left';
      
      // Dividir comentarios en líneas
      const maxWidth = commentBoxWidth - 45;
      const words = sla.comments.split(' ');
      let line = '';
      let y = commentBoxY + 50;
      
      words.forEach((word) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
          ctx.fillText(line, commentBoxX + 20, y);
          line = word + ' ';
          y += 20;
        } else {
          line = testLine;
        }
      });
      if (line) {
        ctx.fillText(line, commentBoxX + 20, y);
      }
    }

    // Convertir canvas a imagen
    const dataUrl = canvas.toDataURL('image/png');
    setImageUrl(dataUrl);
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0 && seconds > 0) {
      return `${minutes} min ${seconds} seg`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return `${seconds} seg`;
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.download = `SLA_${sla.name}_${Date.now()}.png`;
      link.href = imageUrl;
      link.click();
      if (onDownload) onDownload();
    }
  };

  if (sla.status !== 'completed') return null;

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {imageUrl && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '20px'
        }}>
          <img 
            src={imageUrl} 
            alt={`Reporte SLA ${sla.name}`}
            style={{
              maxWidth: '450px',
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
            Descargar Imagen
          </button>
        </div>
      )}
    </div>
  );
}

