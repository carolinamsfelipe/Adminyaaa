/**
 * ADMIN CHARTS — Motor de Gráficos SVG Nativos de Alto Rendimiento
 * Gráficos vectoriales nítidos, interactivos y sin dependencias pesadas
 */

export const AdminCharts = {
  /**
   * Renderiza un gráfico de líneas SVG con área sombreada
   */
  renderLineChart(containerId, { labels = [], data = [], height = 220, color = '#2563EB', fillOpacity = 0.15, formatValue = (v) => `$${v.toLocaleString('es-AR')}` }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94A3B8;font-size:0.875rem">Sin datos suficientes</div>`;
      return;
    }

    const padding = { top: 20, right: 30, bottom: 35, left: 65 };
    const width = container.clientWidth || 600;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data, 1000) * 1.15;
    const minVal = 0;

    const points = data.map((val, idx) => {
      const x = padding.left + (idx / (data.length - 1 || 1)) * innerW;
      const y = padding.top + innerH - ((val - minVal) / (maxVal - minVal)) * innerH;
      return { x, y, val, label: labels[idx] || '' };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`;

    // Líneas de guía horizontales
    const gridLines = [0, 0.33, 0.66, 1].map(pct => {
      const y = padding.top + innerH * (1 - pct);
      const val = minVal + (maxVal - minVal) * pct;
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3 3"/>
        <text x="${padding.left - 8}" y="${y + 4}" font-size="10" fill="#94A3B8" text-anchor="end">${formatValue(Math.round(val))}</text>
      `;
    }).join('');

    // Etiquetas X
    const xLabels = points.map(p => `
      <text x="${p.x}" y="${height - 10}" font-size="11" fill="#64748B" font-weight="600" text-anchor="middle">${p.label}</text>
    `).join('');

    // Puntos interactivos
    const dots = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#FFFFFF" stroke="${color}" stroke-width="2.5">
        <title>${p.label}: ${formatValue(p.val)}</title>
      </circle>
    `).join('');

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible">
        ${gridLines}
        <path d="${areaD}" fill="${color}" fill-opacity="${fillOpacity}"/>
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
        ${xLabels}
      </svg>
    `;
  },

  /**
   * Renderiza un gráfico de barras SVG
   */
  renderBarChart(containerId, { labels = [], data = [], height = 220, color = '#10B981', formatValue = (v) => `$${v.toLocaleString('es-AR')}` }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94A3B8;font-size:0.875rem">Sin datos suficientes</div>`;
      return;
    }

    const padding = { top: 25, right: 20, bottom: 35, left: 65 };
    const width = container.clientWidth || 600;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data, 1000) * 1.15;
    const barWidth = Math.max(12, Math.min(36, (innerW / data.length) * 0.6));

    const bars = data.map((val, idx) => {
      const slotX = padding.left + (idx / data.length) * innerW + (innerW / data.length) / 2;
      const barH = ((val) / maxVal) * innerH;
      const x = slotX - barWidth / 2;
      const y = padding.top + innerH - barH;

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${color}" style="transition:fill 0.15s">
          <title>${labels[idx]}: ${formatValue(val)}</title>
        </rect>
        <text x="${slotX}" y="${height - 12}" font-size="11" fill="#64748B" font-weight="600" text-anchor="middle">${labels[idx]}</text>
      `;
    }).join('');

    // Gridlines horizontales
    const gridLines = [0, 0.5, 1].map(pct => {
      const y = padding.top + innerH * (1 - pct);
      const val = maxVal * pct;
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3 3"/>
        <text x="${padding.left - 8}" y="${y + 4}" font-size="10" fill="#94A3B8" text-anchor="end">${formatValue(Math.round(val))}</text>
      `;
    }).join('');

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        ${gridLines}
        ${bars}
      </svg>
    `;
  },

  /**
   * Renderiza un desglose por categorías (Barras horizontales estilizadas)
   */
  renderCategoryBreakdown(containerId, categoriesData = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entries = Object.entries(categoriesData).map(([name, data]) => ({
      name,
      revenue: data.revenue || 0,
      profit: data.profit || 0
    })).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = entries.reduce((acc, e) => acc + e.revenue, 0) || 1;

    if (entries.length === 0) {
      container.innerHTML = `<div style="text-align:center;color:#94A3B8;padding:2rem">Sin datos de categorías</div>`;
      return;
    }

    container.innerHTML = entries.map(item => {
      const pct = ((item.revenue / totalRevenue) * 100).toFixed(1);
      return `
        <div style="margin-bottom:0.85rem">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600;margin-bottom:0.25rem">
            <span>${item.name}</span>
            <span style="color:#0F172A">$${item.revenue.toLocaleString('es-AR')} (${pct}%)</span>
          </div>
          <div style="height:8px;background:#F1F5F9;border-radius:9999px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:#2563EB;border-radius:9999px"></div>
          </div>
        </div>
      `;
    }).join('');
  }
};
