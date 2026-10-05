/**
 * ADMIN APP CONTROLLER — Controlador General del Panel Administrativo Mayorista
 * Sistema de Gestión Integral para Mayorista a tu Casa (AdminYAAA)
 */
import { AdminService } from './adminService.js';
import { AdminCharts } from './adminCharts.js';
import { COMBOS } from '../../js/data/combos.js';
import { OrdersService } from '../../js/services/ordersService.js';
import { WhatsAppService } from '../../js/services/whatsappService.js';

// Estado local de la UI
const state = {
  currentTab: 'dashboard',
  productsFilter: {
    search: '',
    section: 'todos',
    brand: 'todos',
    stockStatus: 'todos',
    status: 'todos'
  },
  movementsFilter: {
    type: 'todos',
    datePreset: 'todos'
  },
  ordersFilter: {
    status: 'todos'
  },
  bulkPreview: [],
  sessionReceipts: []
};

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupRoleSwitcher();
  setupGlobalEvents();
  
  // Renderizar vista inicial
  switchTab('dashboard');
});

function setupNavigation() {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('btn-sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
    });
  }
}

function setupRoleSwitcher() {
  const select = document.getElementById('select-admin-role');
  const pill = document.getElementById('role-pill-badge');
  if (!select) return;

  const currentRole = AdminService.getCurrentRole();
  select.value = currentRole;
  updateRoleBadge(currentRole);

  select.addEventListener('change', (e) => {
    const newRole = e.target.value;
    AdminService.setCurrentRole(newRole);
    updateRoleBadge(newRole);
    applyRolePermissions();
    showToast(`Rol cambiado a: ${newRole}`, 'info');
  });
}

function updateRoleBadge(role) {
  const pill = document.getElementById('role-pill-badge');
  if (!pill) return;
  pill.textContent = role;
  pill.className = 'role-pill';
  if (role === 'Operador') pill.classList.add('role--operador');
  if (role === 'Solo lectura') pill.classList.add('role--solo-lectura');
}

function applyRolePermissions() {
  const role = AdminService.getCurrentRole();
  const isReadOnly = role === 'Solo lectura';

  // Deshabilitar botones de acción en modo solo lectura
  document.querySelectorAll('[data-permission="write"]').forEach(el => {
    if (isReadOnly) {
      el.setAttribute('disabled', 'true');
      el.title = 'Acción deshabilitada en modo Solo lectura';
    } else {
      el.removeAttribute('disabled');
      el.title = '';
    }
  });
}

function switchTab(tabName) {
  state.currentTab = tabName;

  // Actualizar sidebar activo
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('is-active', link.dataset.tab === tabName);
  });

  // Actualizar vistas
  document.querySelectorAll('.admin-view').forEach(view => {
    view.classList.toggle('is-active', view.id === `view-${tabName}`);
  });

  // Actualizar títulos del header
  const titleEl = document.getElementById('header-current-title');
  const breadcrumbEl = document.getElementById('header-breadcrumb-title');
  const tabTitles = {
    'dashboard': 'Dashboard General',
    'productos': 'Catálogo de Productos',
    'inventario': 'Inventario y Stock',
    'ingresos': 'Ingreso de Mercadería',
    'historial': 'Historial de Movimientos',
    'pedidos': 'Ventas y Pedidos',
    'precios': 'Gestión de Costos y Precios',
    'rentabilidad': 'Análisis de Rentabilidad',
    'reporte-semanal': 'Resumen Semanal',
    'reporte-mensual': 'Resumen Mensual',
    'proveedores': 'Directorio de Proveedores',
    'clientes': 'Directorio de Clientes',
    'configuracion': 'Configuración del Sistema'
  };

  const text = tabTitles[tabName] || 'Panel';
  if (titleEl) titleEl.textContent = text;
  if (breadcrumbEl) breadcrumbEl.textContent = text;

  // Renderizar la vista correspondiente
  switch (tabName) {
    case 'dashboard': renderDashboard(); break;
    case 'productos': renderProductsView(); break;
    case 'inventario': renderInventoryView(); break;
    case 'ingresos': renderGoodsReceiptView(); break;
    case 'historial': renderMovementsView(); break;
    case 'pedidos': renderOrdersView(); break;
    case 'precios': renderPricingView(); break;
    case 'rentabilidad': renderProfitabilityView(); break;
    case 'reporte-semanal': renderWeeklyReportView(); break;
    case 'reporte-mensual': renderMonthlyReportView(); break;
    case 'proveedores': renderSuppliersView(); break;
    case 'clientes': renderCustomersView(); break;
  }

  // Cerrar sidebar en móvil al cambiar tab
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar && window.innerWidth <= 1024) {
    sidebar.classList.remove('is-open');
  }

  applyRolePermissions();
}

// ============================================================
// 1. DASHBOARD GENERAL (SECCIÓN 2)
// ============================================================
function renderDashboard() {
  const kpis = AdminService.getDashboardKPIs();
  const products = AdminService.getProducts();

  // Actualizar KPIs superiores
  document.getElementById('kpi-sales-today').textContent = `$${kpis.salesToday.toLocaleString('es-AR')}`;
  document.getElementById('kpi-sales-week').textContent = `$${kpis.salesWeek.toLocaleString('es-AR')}`;
  document.getElementById('kpi-sales-month').textContent = `$${kpis.salesMonth.toLocaleString('es-AR')}`;
  document.getElementById('kpi-orders-count').textContent = kpis.totalOrdersCount;
  document.getElementById('kpi-low-stock').textContent = kpis.lowStockCount;
  document.getElementById('kpi-out-stock').textContent = kpis.outOfStockCount;
  document.getElementById('kpi-profit-month').textContent = `$${kpis.estimatedProfitMonth.toLocaleString('es-AR')}`;
  document.getElementById('kpi-avg-margin').textContent = `${kpis.avgMarginPercent}%`;

  // Badges en el sidebar
  const lowBadge = document.getElementById('sidebar-low-stock-count');
  if (lowBadge) {
    lowBadge.textContent = kpis.lowStockCount;
    lowBadge.style.display = kpis.lowStockCount > 0 ? 'inline-block' : 'none';
  }

  // Renderizar Alertas Inteligentes
  const alertsContainer = document.getElementById('dashboard-alerts-container');
  const alerts = AdminService.getSmartAlerts();
  if (alertsContainer) {
    alertsContainer.innerHTML = alerts.map(a => `
      <div class="smart-alert alert--${a.type}">
        <div class="smart-alert-content">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <strong>${a.title}:</strong> ${a.message}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Renderizar Gráficos Nativos SVG
  const weekReport = AdminService.getWeeklyReport();
  const daysLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const dailySalesData = [280000, 310000, 290000, 420000, 450000, 510000, 380000];
  const dailyProfitData = [72000, 84000, 78000, 112000, 125000, 142000, 98000];

  AdminCharts.renderLineChart('chart-sales-daily', {
    labels: daysLabels,
    data: dailySalesData,
    height: 220,
    color: '#2563EB'
  });

  AdminCharts.renderBarChart('chart-profit-daily', {
    labels: daysLabels,
    data: dailyProfitData,
    height: 220,
    color: '#10B981'
  });

  // Renderizar Rankings de Productos
  renderDashboardRankings();
}

function renderDashboardRankings() {
  const products = AdminService.getProducts();

  // 1. Top Vendidos (unidades)
  const topSales = [...products].sort((a, b) => (b.totalUnitsOut || 0) - (a.totalUnitsOut || 0)).slice(0, 4);
  const containerSales = document.getElementById('ranking-top-sellers');
  if (containerSales) {
    containerSales.innerHTML = topSales.map((p, i) => `
      <div class="ranking-item">
        <div class="ranking-item-left">
          <span class="rank-number ${i === 0 ? 'top-1' : ''}">${i + 1}</span>
          <img src="../${p.image}" class="table-img-cell" alt="">
          <span class="ranking-item-name" title="${p.name}">${p.name}</span>
        </div>
        <span class="ranking-item-val">${p.totalUnitsOut || 0} un.</span>
      </div>
    `).join('');
  }

  // 2. Mayor Facturación
  const topRevenue = [...products].sort((a, b) => ((b.totalUnitsOut || 0) * b.price) - ((a.totalUnitsOut || 0) * a.price)).slice(0, 4);
  const containerRev = document.getElementById('ranking-top-revenue');
  if (containerRev) {
    containerRev.innerHTML = topRevenue.map((p, i) => `
      <div class="ranking-item">
        <div class="ranking-item-left">
          <span class="rank-number ${i === 0 ? 'top-1' : ''}">${i + 1}</span>
          <img src="../${p.image}" class="table-img-cell" alt="">
          <span class="ranking-item-name" title="${p.name}">${p.name}</span>
        </div>
        <span class="ranking-item-val">$${(((p.totalUnitsOut || 0) * p.price)).toLocaleString('es-AR')}</span>
      </div>
    `).join('');
  }

  // 3. Mayor Margen %
  const topMargin = [...products].map(p => ({
    ...p,
    marginPct: p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0
  })).sort((a, b) => b.marginPct - a.marginPct).slice(0, 4);
  const containerMargin = document.getElementById('ranking-top-margin');
  if (containerMargin) {
    containerMargin.innerHTML = topMargin.map((p, i) => `
      <div class="ranking-item">
        <div class="ranking-item-left">
          <span class="rank-number ${i === 0 ? 'top-1' : ''}">${i + 1}</span>
          <span class="ranking-item-name" title="${p.name}">${p.name}</span>
        </div>
        <span class="ranking-item-val text-success">${p.marginPct.toFixed(1)}%</span>
      </div>
    `).join('');
  }

  // 4. Menor Margen % (Alerta de margen caído)
  const lowMargin = [...products].map(p => ({
    ...p,
    marginPct: p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0
  })).sort((a, b) => a.marginPct - b.marginPct).slice(0, 4);
  const containerLowMargin = document.getElementById('ranking-lowest-margin');
  if (containerLowMargin) {
    containerLowMargin.innerHTML = lowMargin.map((p, i) => `
      <div class="ranking-item" data-action="review-product-margin" data-id="${p.id}" style="cursor:pointer" title="Hacé clic para revisar y actualizar el precio de ${p.name}">
        <div class="ranking-item-left">
          <span class="rank-number">${i + 1}</span>
          <span class="ranking-item-name" title="${p.name}">${p.name}</span>
        </div>
        <span class="ranking-item-val text-danger" style="font-weight:700">${p.marginPct.toFixed(1)}%</span>
      </div>
    `).join('');
  }
}

// ============================================================
// 2. PRODUCTOS (SECCIÓN 3 & 4)
// ============================================================
function renderProductsView() {
  const products = AdminService.getProducts();
  const f = state.productsFilter;

  // Filtrado reactivo
  let filtered = products.filter(p => {
    const q = f.search.trim().toLowerCase();
    if (q) {
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchBarcode = p.barcode.includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchBarcode && !matchBrand) return false;
    }

    if (f.section !== 'todos' && p.section !== f.section) return false;
    if (f.brand !== 'todos' && p.brand !== f.brand) return false;
    if (f.status !== 'todos' && p.status !== f.status) return false;

    if (f.stockStatus === 'normal' && (p.stock <= p.minStock || p.stock === 0)) return false;
    if (f.stockStatus === 'bajo' && (p.stock > p.minStock || p.stock === 0)) return false;
    if (f.stockStatus === 'agotado' && p.stock > 0) return false;

    return true;
  });

  const countEl = document.getElementById('products-count-badge');
  if (countEl) countEl.textContent = `${filtered.length} productos`;

  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:3rem;color:#94A3B8">No se encontraron productos con los filtros seleccionados.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.slice(0, 100).map(p => {
    const marginARS = p.price - p.cost;
    const marginPct = p.price > 0 ? ((marginARS / p.price) * 100).toFixed(1) : 0;

    let stockBadge = `<span class="stock-badge stock-normal">🟢 ${p.stock}</span>`;
    if (p.stock === 0) {
      stockBadge = `<span class="stock-badge stock-danger">🔴 Agotado</span>`;
    } else if (p.stock <= p.minStock) {
      stockBadge = `<span class="stock-badge stock-warning">🟡 Bajo (${p.stock})</span>`;
    }

    return `
      <tr data-product-id="${p.id}">
        <td><img src="../${p.image}" class="table-img-cell" alt="${p.name}"></td>
        <td><code>${p.sku}</code></td>
        <td>
          <div style="font-weight:700;color:#0F172A">${p.name}</div>
          <div style="font-size:0.75rem;color:#64748B">${p.packagePresentation || 'Bulto'}</div>
        </td>
        <td>${p.section}</td>
        <td><strong>${p.brand}</strong></td>
        <td>${p.unit}</td>
        <td>${stockBadge}</td>
        <td>${p.minStock}</td>
        <td>$${p.cost.toLocaleString('es-AR')}</td>
        <td><strong>$${p.price.toLocaleString('es-AR')}</strong></td>
        <td style="color:${marginARS >= 0 ? '#10B981' : '#EF4444'};font-weight:700">$${marginARS.toLocaleString('es-AR')}</td>
        <td style="font-weight:700;color:${marginPct >= 25 ? '#10B981' : '#F59E0B'}">${marginPct}%</td>
        <td>
          <button type="button" class="btn btn--secondary btn--sm" data-action="view-product-detail" data-id="${p.id}">
            Ver Ficha
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Abrir Ficha Individual del Producto (Sección 4)
function openProductDetailModal(productId) {
  const p = AdminService.getProductById(productId);
  if (!p) return;

  const modal = document.getElementById('modal-product-detail');
  if (!modal) return;

  document.getElementById('modal-pdetail-title').textContent = `${p.name} (${p.sku})`;
  document.getElementById('pdetail-sku').value = p.sku;
  document.getElementById('pdetail-barcode').value = p.barcode;
  document.getElementById('pdetail-name').value = p.name;
  document.getElementById('pdetail-brand').value = p.brand;
  document.getElementById('pdetail-section').value = p.section;
  document.getElementById('pdetail-unit').value = p.unit;
  document.getElementById('pdetail-presentation').value = p.packagePresentation || '';
  document.getElementById('pdetail-stock').value = p.stock;
  document.getElementById('pdetail-minstock').value = p.minStock;
  document.getElementById('pdetail-maxstock').value = p.maxStock || 200;
  document.getElementById('pdetail-cost').value = p.cost;
  document.getElementById('pdetail-price').value = p.price;
  document.getElementById('pdetail-target-margin').value = p.targetMargin || 30;

  // KPIs de la ficha
  const marginARS = p.price - p.cost;
  const marginPct = p.price > 0 ? ((marginARS / p.price) * 100).toFixed(1) : 0;
  document.getElementById('pdetail-stat-margin-ars').textContent = `$${marginARS.toLocaleString('es-AR')}`;
  document.getElementById('pdetail-stat-margin-pct').textContent = `${marginPct}%`;
  document.getElementById('pdetail-stat-units-in').textContent = p.totalUnitsIn || p.stock;
  document.getElementById('pdetail-stat-units-out').textContent = p.totalUnitsOut || 0;
  document.getElementById('pdetail-stat-last-in').textContent = p.lastInDate ? new Date(p.lastInDate).toLocaleDateString('es-AR') : '—';
  document.getElementById('pdetail-stat-last-out').textContent = p.lastOutDate ? new Date(p.lastOutDate).toLocaleDateString('es-AR') : '—';

  // Historial de precios y costos
  const history = AdminService.getPriceHistory(p.id);
  const histTbody = document.getElementById('pdetail-price-history-body');
  if (histTbody) {
    if (history.length === 0) {
      histTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:#94A3B8">Sin cambios registrados.</td></tr>`;
    } else {
      histTbody.innerHTML = history.map(h => `
        <tr>
          <td>${new Date(h.timestamp).toLocaleString('es-AR')}</td>
          <td>$${h.cost.toLocaleString('es-AR')}</td>
          <td><strong>$${h.price.toLocaleString('es-AR')}</strong></td>
          <td><span style="color:#10B981;font-weight:700">${h.marginPercent}%</span></td>
          <td>${h.reason || 'Actualización'}</td>
          <td><code>${h.user || 'Admin'}</code></td>
        </tr>
      `).join('');
    }
  }

  // Guardar cambios en el producto
  const form = document.getElementById('form-product-detail');
  form.onsubmit = (e) => {
    e.preventDefault();
    try {
      AdminService.updateProduct(p.id, {
        name: document.getElementById('pdetail-name').value.trim(),
        brand: document.getElementById('pdetail-brand').value.trim(),
        cost: parseFloat(document.getElementById('pdetail-cost').value),
        price: parseFloat(document.getElementById('pdetail-price').value),
        minStock: parseInt(document.getElementById('pdetail-minstock').value, 10),
        targetMargin: parseFloat(document.getElementById('pdetail-target-margin').value),
        packagePresentation: document.getElementById('pdetail-presentation').value.trim()
      }, AdminService.getCurrentRole());

      closeModal('modal-product-detail');
      renderProductsView();
      showToast('Ficha de producto actualizada con éxito', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  openModal('modal-product-detail');
}

// ============================================================
// 3. INGRESO DE NUEVA MERCADERÍA (SECCIÓN 5)
// ============================================================
function renderGoodsReceiptView() {
  const suppliers = AdminService.getSuppliers();
  const products = AdminService.getProducts();

  const supSelect = document.getElementById('receipt-supplier-select');
  if (supSelect) {
    const currentVal = supSelect.value;
    supSelect.innerHTML = `<option value="">-- Seleccionar proveedor --</option>` +
      suppliers.map(s => `<option value="${s.id}">${s.name} (${s.categories.join(', ')})</option>`).join('');
    if (currentVal) supSelect.value = currentVal;
  }

  // Fecha por defecto si está vacía
  const dateInput = document.getElementById('receipt-date-input');
  if (dateInput && !dateInput.value) {
    const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    dateInput.value = localNow;
  }

  const prodSelect = document.getElementById('receipt-product-select');
  if (prodSelect) {
    prodSelect.innerHTML = `<option value="">-- Seleccionar producto existente --</option>` +
      products.map(p => `<option value="${p.id}" data-cost="${p.cost}" data-price="${p.price}" data-margin="${p.targetMargin || 30}">${p.name} [Stock: ${p.stock}]</option>`).join('');
  }

  // Elementos de búsqueda y selección
  const searchInput = document.getElementById('receipt-product-search');
  const clearBtn = document.getElementById('btn-clear-receipt-product');
  const resultsDropdown = document.getElementById('receipt-product-results');
  const selectedCard = document.getElementById('receipt-selected-product-card');
  const changeProdBtn = document.getElementById('btn-change-receipt-product');
  const clearFormBtn = document.getElementById('btn-clear-receipt-form');

  const costInput = document.getElementById('receipt-cost-input');
  const qtyInput = document.getElementById('receipt-qty-input');
  const suggestedPriceEl = document.getElementById('receipt-suggested-price-val');
  const targetMarginEl = document.getElementById('receipt-suggested-margin-val');
  const newPriceInput = document.getElementById('receipt-new-price-input');
  const updatePriceCheck = document.getElementById('receipt-update-price-check');

  function updateSuggested() {
    const cost = parseFloat(costInput.value) || 0;
    const selectedId = prodSelect ? prodSelect.value : null;
    const currentProd = products.find(p => p.id === selectedId);
    const targetMargin = currentProd ? (currentProd.targetMargin || 30) : 30;

    if (cost > 0) {
      const marginDecimal = targetMargin / 100;
      const suggestedPrice = Math.round((cost / (1 - marginDecimal)) / 10) * 10;
      if (suggestedPriceEl) suggestedPriceEl.textContent = `$${suggestedPrice.toLocaleString('es-AR')}`;
      if (targetMarginEl) targetMarginEl.textContent = `${targetMargin}%`;
      if (newPriceInput) newPriceInput.value = suggestedPrice;
    } else {
      if (suggestedPriceEl) suggestedPriceEl.textContent = '—';
      if (targetMarginEl) targetMarginEl.textContent = '30%';
    }
  }

  function selectProduct(p) {
    if (!p) return;
    if (prodSelect) prodSelect.value = p.id;
    if (costInput) costInput.value = p.cost;

    // Mostrar tarjeta de producto seleccionado
    if (selectedCard) {
      document.getElementById('receipt-selected-img').src = p.image || '../img/productos/aceite.webp';
      document.getElementById('receipt-selected-name').textContent = p.name;
      document.getElementById('receipt-selected-sku').textContent = p.sku;
      document.getElementById('receipt-selected-barcode').textContent = `EAN: ${p.barcode}`;
      document.getElementById('receipt-selected-stock').textContent = p.stock;
      document.getElementById('receipt-selected-cost').textContent = `$${p.cost.toLocaleString('es-AR')}`;
      document.getElementById('receipt-selected-price').textContent = `$${p.price.toLocaleString('es-AR')}`;
      selectedCard.style.display = 'flex';
    }

    // Ocultar campo de búsqueda temporalmente
    if (resultsDropdown) resultsDropdown.style.display = 'none';
    if (searchInput) {
      searchInput.value = `${p.name} (${p.sku})`;
      searchInput.parentElement.style.display = 'none';
    }

    updateSuggested();

    // Mover foco a la cantidad para carga veloz
    if (qtyInput) {
      qtyInput.focus();
      qtyInput.select();
    }
  }

  function resetProductSelection() {
    if (prodSelect) prodSelect.value = '';
    if (selectedCard) selectedCard.style.display = 'none';
    if (searchInput) {
      searchInput.value = '';
      searchInput.parentElement.style.display = 'flex';
      if (clearBtn) clearBtn.style.display = 'none';
      searchInput.focus();
    }
    if (resultsDropdown) resultsDropdown.style.display = 'none';
    if (qtyInput) qtyInput.value = '';
    if (costInput) costInput.value = '';
    if (newPriceInput) newPriceInput.value = '';
    if (suggestedPriceEl) suggestedPriceEl.textContent = '—';
  }

  // Buscador interactivo por nombre, SKU o código de barras
  if (searchInput && resultsDropdown) {
    searchInput.oninput = () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        if (clearBtn) clearBtn.style.display = 'none';
        resultsDropdown.style.display = 'none';
        return;
      }
      if (clearBtn) clearBtn.style.display = 'block';

      const matches = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      ).slice(0, 15);

      if (matches.length === 0) {
        resultsDropdown.innerHTML = `
          <div style="padding:1rem;text-align:center;color:#64748B;font-size:0.875rem">
            No se encontraron productos con "<strong>${q}</strong>".
          </div>
        `;
        resultsDropdown.style.display = 'block';
        return;
      }

      resultsDropdown.innerHTML = matches.map(p => `
        <div class="search-result-item" data-id="${p.id}">
          <img src="${p.image}" alt="" class="search-result-img">
          <div class="search-result-info">
            <div class="search-result-title">${p.name}</div>
            <div class="search-result-meta">
              <span class="badge badge--primary" style="font-size:0.7rem">${p.sku}</span>
              <span>Stock: <strong>${p.stock} un.</strong></span>
              <span>Costo: <strong>$${p.cost.toLocaleString('es-AR')}</strong></span>
              <span>Precio: <strong>$${p.price.toLocaleString('es-AR')}</strong></span>
            </div>
          </div>
        </div>
      `).join('');
      resultsDropdown.style.display = 'block';
    };

    // Selección por clic
    resultsDropdown.onclick = (e) => {
      const item = e.target.closest('.search-result-item');
      if (item) {
        const p = products.find(prod => prod.id === item.dataset.id);
        if (p) selectProduct(p);
      }
    };

    // Selección por Enter
    searchInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstItem = resultsDropdown.querySelector('.search-result-item');
        if (firstItem) {
          const p = products.find(prod => prod.id === firstItem.dataset.id);
          if (p) selectProduct(p);
        }
      } else if (e.key === 'Escape') {
        resultsDropdown.style.display = 'none';
      }
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      if (searchInput) {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        resultsDropdown.style.display = 'none';
        searchInput.focus();
      }
    };
  }

  if (changeProdBtn) {
    changeProdBtn.onclick = resetProductSelection;
  }

  if (clearFormBtn) {
    clearFormBtn.onclick = resetProductSelection;
  }

  if (costInput) costInput.oninput = updateSuggested;

  // Clic fuera del buscador cierra el dropdown
  document.addEventListener('click', (e) => {
    if (searchInput && resultsDropdown && !searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
      resultsDropdown.style.display = 'none';
    }
  });

  // Renderizar tabla de sesión
  function renderSessionReceipts() {
    const sessionCard = document.getElementById('receipt-session-card');
    const sessionTbody = document.getElementById('receipt-session-tbody');
    const sessionCount = document.getElementById('receipt-session-count');
    if (!sessionCard || !sessionTbody) return;

    if (!state.sessionReceipts || state.sessionReceipts.length === 0) {
      sessionCard.style.display = 'none';
      return;
    }

    sessionCard.style.display = 'block';
    if (sessionCount) sessionCount.textContent = state.sessionReceipts.length;

    sessionTbody.innerHTML = state.sessionReceipts.map(it => `
      <tr>
        <td style="color:#64748B;font-size:0.825rem">${it.time}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <img src="${it.product.image}" alt="" style="width:32px;height:32px;object-fit:contain;border:1px solid #E2E8F0;border-radius:4px">
            <div>
              <strong style="font-size:0.875rem;color:#0F172A;display:block">${it.product.name}</strong>
              <small style="color:#64748B">${it.product.sku}</small>
            </div>
          </div>
        </td>
        <td><strong class="text-success" style="font-size:0.95rem">+${it.qty} un.</strong></td>
        <td style="font-weight:600">$${it.cost.toLocaleString('es-AR')}</td>
        <td><span class="badge badge--nuevo">${it.newStock} un.</span></td>
        <td style="color:#64748B">${it.invoiceNum || 'S/N'}</td>
      </tr>
    `).join('');
  }

  // Render inicial de sesión
  renderSessionReceipts();

  // Formulario de confirmación (SE QUEDA EN LA MISMA PANTALLA)
  const form = document.getElementById('form-goods-receipt');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      try {
        const supplierId = supSelect.value;
        const productId = prodSelect.value;
        const qty = parseInt(qtyInput.value, 10);
        const cost = parseFloat(costInput.value);
        const invoiceNum = document.getElementById('receipt-invoice-num').value.trim();
        const date = dateInput.value || new Date().toISOString();
        const notes = document.getElementById('receipt-notes-input').value.trim();
        const updateSalesPrice = updatePriceCheck ? updatePriceCheck.checked : false;
        const newPrice = updateSalesPrice && newPriceInput ? parseFloat(newPriceInput.value) : null;

        if (!supplierId) throw new Error('Por favor seleccioná un proveedor.');
        if (!productId) throw new Error('Por favor buscá y seleccioná un producto para ingresar.');
        if (!qty || qty <= 0) throw new Error('La cantidad ingresada debe ser mayor a 0.');
        if (!cost || cost <= 0) throw new Error('El costo unitario debe ser mayor a $0.');

        const result = AdminService.recordGoodsReceipt({
          supplierId,
          productId,
          quantity: qty,
          unitCost: cost,
          date,
          invoiceNumber: invoiceNum,
          notes,
          updateSalesPrice,
          newPrice,
          user: AdminService.getCurrentRole()
        });

        const p = result.product;

        // Registrar en historial de la sesión
        if (!state.sessionReceipts) state.sessionReceipts = [];
        state.sessionReceipts.unshift({
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          product: p,
          qty: qty,
          cost: cost,
          newStock: p.stock,
          invoiceNum: invoiceNum
        });

        // Mostrar Banner de Éxito en la Misma Pantalla
        const feedbackBanner = document.getElementById('receipt-feedback-banner');
        if (feedbackBanner) {
          document.getElementById('receipt-feedback-title').textContent = 
            `¡Ingreso registrado: ${p.name}!`;
          document.getElementById('receipt-feedback-desc').textContent = 
            `Se sumaron ${qty} unidades al stock (Stock nuevo: ${p.stock} un.). Costo actualizado a $${cost.toLocaleString('es-AR')}${updateSalesPrice && newPrice ? ` | Nuevo precio de venta: $${newPrice.toLocaleString('es-AR')}` : ''}. Podés continuar cargando el siguiente ítem del remito.`;
          feedbackBanner.style.display = 'block';
          feedbackBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        showToast(`✅ ${qty} un. de "${p.name}" ingresadas con éxito`, 'success');

        // Actualizar tabla de sesión
        renderSessionReceipts();

        // Limpiar únicamente los datos del producto para agilizar la carga del siguiente
        resetProductSelection();
        const notesEl = document.getElementById('receipt-notes-input');
        if (notesEl) notesEl.value = '';

      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }
}

// ============================================================
// 4. PRECIOS Y COSTOS + ACTUALIZACIÓN MASIVA (SECCIÓN 6)
// ============================================================
function renderPricingView() {
  const products = AdminService.getProducts();
  const tbody = document.getElementById('pricing-table-body');
  if (!tbody) return;

  tbody.innerHTML = products.slice(0, 100).map(p => {
    const marginARS = p.price - p.cost;
    const marginPct = p.price > 0 ? ((marginARS / p.price) * 100).toFixed(1) : 0;
    return `
      <tr>
        <td><code>${p.sku}</code></td>
        <td><strong>${p.name}</strong></td>
        <td>${p.section}</td>
        <td>$${p.cost.toLocaleString('es-AR')}</td>
        <td><strong style="font-size:0.95rem">$${p.price.toLocaleString('es-AR')}</strong></td>
        <td style="color:${marginARS >= 0 ? '#10B981' : '#EF4444'};font-weight:700">$${marginARS.toLocaleString('es-AR')}</td>
        <td><span style="font-weight:800;color:${marginPct >= 25 ? '#10B981' : '#F59E0B'}">${marginPct}%</span></td>
        <td>${p.targetMargin || 30}%</td>
        <td>
          <button type="button" class="btn btn--secondary btn--sm" data-action="quick-edit-price" data-id="${p.id}">
            Modificar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Modal de Actualización Masiva de Precios
function openBulkPriceModal() {
  const modal = document.getElementById('modal-bulk-price-update');
  if (!modal) return;

  const previewBtn = document.getElementById('btn-preview-bulk-update');
  const applyBtn = document.getElementById('btn-apply-bulk-update');
  const tbody = document.getElementById('bulk-preview-tbody');

  previewBtn.onclick = () => {
    try {
      const filterType = document.getElementById('bulk-scope-select').value;
      const filterVal = document.getElementById('bulk-category-select').value;
      const adjType = document.getElementById('bulk-type-select').value;
      const adjVal = parseFloat(document.getElementById('bulk-value-input').value);

      state.bulkPreview = AdminService.previewBulkPriceUpdate({
        filterType,
        filterValue: filterVal,
        adjustmentType: adjType,
        adjustmentValue: adjVal
      });

      tbody.innerHTML = state.bulkPreview.slice(0, 50).map(item => `
        <tr>
          <td>${item.name}</td>
          <td>$${item.cost.toLocaleString('es-AR')}</td>
          <td>$${item.oldPrice.toLocaleString('es-AR')}</td>
          <td><strong style="color:#2563EB">$${item.newPrice.toLocaleString('es-AR')}</strong></td>
          <td style="color:${item.diffARS >= 0 ? '#10B981' : '#EF4444'};font-weight:700">${item.variationPercent > 0 ? '+' : ''}${item.variationPercent}%</td>
          <td><span style="font-weight:700">${item.newMarginPercent}%</span></td>
        </tr>
      `).join('');

      document.getElementById('bulk-preview-summary-text').textContent = `Se previsualizan ${state.bulkPreview.length} productos afectados.`;
      applyBtn.removeAttribute('disabled');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  applyBtn.onclick = () => {
    if (state.bulkPreview.length === 0) return;
    const reason = document.getElementById('bulk-reason-input').value.trim() || 'Actualización masiva de precios';

    const count = AdminService.applyBulkPriceUpdate(state.bulkPreview, reason, AdminService.getCurrentRole());
    closeModal('modal-bulk-price-update');
    renderPricingView();
    showToast(`¡Se actualizaron con éxito los precios de ${count} productos!`, 'success');
  };

  openModal('modal-bulk-price-update');
}

// ============================================================
// 5. INVENTARIO Y STOCK (SECCIÓN 8)
// ============================================================
function renderInventoryView() {
  const products = AdminService.getProducts();

  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalValuationCost = products.reduce((acc, p) => acc + ((p.stock || 0) * p.cost), 0);
  const totalValuationPrice = products.reduce((acc, p) => acc + ((p.stock || 0) * p.price), 0);

  document.getElementById('inv-stat-total-units').textContent = `${totalStockUnits.toLocaleString('es-AR')} un.`;
  document.getElementById('inv-stat-valuation-cost').textContent = `$${totalValuationCost.toLocaleString('es-AR')}`;
  document.getElementById('inv-stat-valuation-price').textContent = `$${totalValuationPrice.toLocaleString('es-AR')}`;

  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;

  tbody.innerHTML = products.slice(0, 100).map(p => {
    let stockBadge = `<span class="stock-badge stock-normal">🟢 Normal</span>`;
    if (p.stock === 0) stockBadge = `<span class="stock-badge stock-danger">🔴 Agotado</span>`;
    else if (p.stock <= p.minStock) stockBadge = `<span class="stock-badge stock-warning">🟡 Stock Crítico</span>`;

    return `
      <tr>
        <td><code>${p.sku}</code></td>
        <td>
          <div style="font-weight:700">${p.name}</div>
          <div style="font-size:0.75rem;color:#64748B">${p.brand} | ${p.section}</div>
        </td>
        <td><strong>${p.stock}</strong> ${p.unit}</td>
        <td>${p.minStock}</td>
        <td>${p.maxStock || 200}</td>
        <td>${p.totalUnitsIn || p.stock}</td>
        <td>${p.totalUnitsOut || 0}</td>
        <td>${stockBadge}</td>
        <td>
          <button type="button" class="btn btn--secondary btn--sm" data-action="adjust-stock" data-id="${p.id}">
            Ajustar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Modal de Ajuste Manual de Stock
function openStockAdjustModal(productId) {
  const p = AdminService.getProductById(productId);
  if (!p) return;

  const modal = document.getElementById('modal-stock-adjust');
  if (!modal) return;

  document.getElementById('adjust-product-name').textContent = `${p.name} (${p.sku})`;
  document.getElementById('adjust-current-stock').textContent = `${p.stock} ${p.unit}`;
  document.getElementById('adjust-new-stock-input').value = p.stock;
  document.getElementById('adjust-reason-input').value = '';

  const form = document.getElementById('form-stock-adjust');
  form.onsubmit = (e) => {
    e.preventDefault();
    try {
      const newStock = parseInt(document.getElementById('adjust-new-stock-input').value, 10);
      const reason = document.getElementById('adjust-reason-input').value.trim();

      AdminService.adjustStock({
        productId: p.id,
        newStock: newStock,
        reason: reason,
        user: AdminService.getCurrentRole()
      });

      closeModal('modal-stock-adjust');
      renderInventoryView();
      showToast('Ajuste de stock registrado y auditado correctamente', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  openModal('modal-stock-adjust');
}

// ============================================================
// ASISTENTE DE REVISIÓN Y AJUSTE DE BAJO MARGEN (MODAL)
// ============================================================
function openLowMarginReviewModal(focusProductId = null) {
  const products = AdminService.getProducts();
  const modal = document.getElementById('modal-low-margin-review');
  const tbody = document.getElementById('low-margin-table-body');
  const selectedCountEl = document.getElementById('low-margin-selected-count');
  const checkAll = document.getElementById('check-all-low-margin');
  const targetMarginInput = document.getElementById('low-margin-target-input');
  if (!modal || !tbody) return;

  // Filtrar productos con menor margen
  const allWithMargin = products.map(p => {
    const marginARS = p.price - p.cost;
    const marginPct = p.price > 0 ? ((marginARS / p.price) * 100) : 0;
    return { ...p, marginARS, marginPct };
  }).sort((a, b) => a.marginPct - b.marginPct);

  // Seleccionar productos con margen bajo (< 25%) o al menos los 12 con menor margen
  let lowMarginItems = allWithMargin.filter(p => p.marginPct < 25 || p.id === focusProductId).slice(0, 30);
  if (lowMarginItems.length < 8) {
    const bottomSlice = allWithMargin.slice(0, 10);
    const existingIds = new Set(lowMarginItems.map(x => x.id));
    bottomSlice.forEach(x => {
      if (!existingIds.has(x.id)) lowMarginItems.push(x);
    });
  }

  tbody.innerHTML = lowMarginItems.map(p => {
    const isFocused = focusProductId && p.id === focusProductId;
    return `
      <tr data-id="${p.id}" class="low-margin-row ${isFocused ? 'is-focused' : ''}" style="${isFocused ? 'background:#FEF3C7;' : ''}">
        <td style="text-align:center">
          <input type="checkbox" class="low-margin-check" data-id="${p.id}" checked>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:0.6rem">
            <img src="${p.image}" alt="" style="width:36px;height:36px;object-fit:contain;background:#FFF;border-radius:4px;border:1px solid #E2E8F0;padding:2px;flex-shrink:0">
            <div>
              <strong style="font-size:0.875rem;color:#0F172A;display:block">${p.name}</strong>
              <small style="color:#64748B">${p.brand} · ${p.sku}</small>
            </div>
          </div>
        </td>
        <td style="font-weight:600;color:#334155">$${p.cost.toLocaleString('es-AR')}</td>
        <td style="font-weight:600;color:#64748B">$${p.price.toLocaleString('es-AR')}</td>
        <td>
          <span class="badge ${p.marginPct < 20 ? 'badge--critico' : 'badge--agotado'}" style="font-weight:700">
            ${p.marginPct.toFixed(1)}%
          </span>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:0.25rem">
            <span style="font-weight:700;color:#64748B">$</span>
            <input type="number" step="10" min="${p.cost + 10}" class="form-input low-margin-price-input" data-id="${p.id}" data-cost="${p.cost}" value="${p.price}" style="width:110px;padding:0.35rem 0.5rem;font-weight:700;text-align:right">
          </div>
        </td>
        <td>
          <span class="badge badge--nuevo low-margin-new-badge" data-id="${p.id}" style="font-weight:700">
            ${p.marginPct.toFixed(1)}%
          </span>
        </td>
      </tr>
    `;
  }).join('');

  function updateSelectedCount() {
    const checks = tbody.querySelectorAll('.low-margin-check:checked');
    if (selectedCountEl) selectedCountEl.textContent = checks.length;
  }

  updateSelectedCount();

  // Seleccionar / Deseleccionar todos
  if (checkAll) {
    checkAll.checked = true;
    checkAll.onchange = () => {
      tbody.querySelectorAll('.low-margin-check').forEach(chk => {
        chk.checked = checkAll.checked;
      });
      updateSelectedCount();
    };
  }

  // Cambio individual de checkbox
  tbody.onchange = (e) => {
    if (e.target.classList.contains('low-margin-check')) {
      updateSelectedCount();
    }
  };

  // Recálculo dinámico de margen en vivo al tipear precio
  tbody.oninput = (e) => {
    if (e.target.classList.contains('low-margin-price-input')) {
      const input = e.target;
      const pid = input.dataset.id;
      const cost = parseFloat(input.dataset.cost) || 0;
      const newPrice = parseFloat(input.value) || 0;
      const badge = tbody.querySelector(`.low-margin-new-badge[data-id="${pid}"]`);
      if (badge && newPrice > 0) {
        const newMargin = (((newPrice - cost) / newPrice) * 100).toFixed(1);
        badge.textContent = `${newMargin}%`;
        badge.className = `badge low-margin-new-badge ${newMargin >= 25 ? 'badge--activo' : (newMargin >= 20 ? 'badge--nuevo' : 'badge--critico')}`;
      }
    }
  };

  // Aplicar margen objetivo a todos los seleccionados
  const applyTargetBtn = document.getElementById('btn-apply-target-margin-all');
  if (applyTargetBtn) {
    applyTargetBtn.onclick = () => {
      const targetMargin = parseFloat(targetMarginInput?.value) || 30;
      const marginDecimal = targetMargin / 100;
      let count = 0;

      tbody.querySelectorAll('.low-margin-row').forEach(row => {
        const chk = row.querySelector('.low-margin-check');
        if (chk && chk.checked) {
          const input = row.querySelector('.low-margin-price-input');
          const cost = parseFloat(input.dataset.cost) || 0;
          if (cost > 0) {
            const suggested = Math.round((cost / (1 - marginDecimal)) / 10) * 10;
            input.value = suggested;
            const badge = row.querySelector('.low-margin-new-badge');
            if (badge) {
              badge.textContent = `${targetMargin}%`;
              badge.className = 'badge badge--activo low-margin-new-badge';
            }
            count++;
          }
        }
      });

      showToast(`Precios sugeridos calculados para ${count} productos (Margen ${targetMargin}%)`, 'info');
    };
  }

  // Guardar y aplicar precios actualizados
  const saveBtn = document.getElementById('btn-save-low-margin-prices');
  if (saveBtn) {
    saveBtn.onclick = () => {
      try {
        let updatedCount = 0;
        tbody.querySelectorAll('.low-margin-row').forEach(row => {
          const chk = row.querySelector('.low-margin-check');
          if (chk && chk.checked) {
            const pid = row.dataset.id;
            const input = row.querySelector('.low-margin-price-input');
            const newPrice = parseFloat(input.value);
            const origProd = products.find(p => p.id === pid);

            if (origProd && newPrice > 0 && newPrice !== origProd.price) {
              AdminService.updateProduct(pid, {
                price: newPrice,
                priceReason: 'Ajuste masivo por revisión de bajo margen'
              }, AdminService.getCurrentRole());
              updatedCount++;
            }
          }
        });

        closeModal('modal-low-margin-review');

        if (updatedCount > 0) {
          showToast(`¡Se actualizaron con éxito los precios de ${updatedCount} productos!`, 'success');
          renderDashboardView();
          renderPricingView();
          renderProductsView();
        } else {
          showToast('No se modificó ningún precio.', 'info');
        }
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }

  openModal('modal-low-margin-review');
}

// ============================================================
// 6. HISTORIAL DE MOVIMIENTOS Y AUDITORÍA (SECCIÓN 7)
// ============================================================
function renderMovementsView() {
  const movements = AdminService.getMovements(state.movementsFilter);
  const tbody = document.getElementById('movements-table-body');
  if (!tbody) return;

  if (movements.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:3rem;color:#94A3B8">Sin movimientos registrados para los filtros seleccionados.</td></tr>`;
    return;
  }

  tbody.innerHTML = movements.slice(0, 100).map(m => {
    let typeBadge = `<span class="status-badge status--confirmado">${m.type}</span>`;
    if (m.type === 'INGRESO') typeBadge = `<span class="status-badge status--entregado">📦 INGRESO</span>`;
    if (m.type === 'VENTA') typeBadge = `<span class="status-badge status--confirmado">🛒 VENTA</span>`;
    if (m.type === 'AJUSTE_NEGATIVO') typeBadge = `<span class="status-badge status--cancelado">📉 MERMA/AJUSTE</span>`;
    if (m.type === 'AJUSTE_POSITIVO') typeBadge = `<span class="status-badge status--preparando">📈 AJUSTE +</span>`;

    const qtySign = m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`;

    return `
      <tr>
        <td><code>#${m.id}</code></td>
        <td>${new Date(m.timestamp).toLocaleString('es-AR')}</td>
        <td>${typeBadge}</td>
        <td><strong>${m.productName}</strong></td>
        <td style="font-weight:800;color:${m.quantity > 0 ? '#10B981' : '#DC2626'}">${qtySign}</td>
        <td>${m.previousStock} → <strong>${m.newStock}</strong></td>
        <td>${m.unitCost ? `$${m.unitCost.toLocaleString('es-AR')}` : '—'}</td>
        <td><code>${m.documentNumber || '—'}</code></td>
        <td>${m.reason}</td>
        <td><span style="font-size:0.75rem;font-weight:700;color:#64748B">${m.user || 'Admin'}</span></td>
      </tr>
    `;
  }).join('');
}

// ============================================================
// 7. VENTAS Y PEDIDOS (SECCIÓN 13)
// ============================================================
function renderOrdersView() {
  const orders = OrdersService.getOrders();
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  tbody.innerHTML = orders.map(o => {
    const statusClasses = {
      'Pendiente': 'status--pendiente',
      'Confirmado': 'status--confirmado',
      'Preparando': 'status--preparando',
      'Listo': 'status--listo',
      'Enviado': 'status--enviado',
      'Entregado': 'status--entregado',
      'Cancelado': 'status--cancelado'
    };
    const sClass = statusClasses[o.status] || 'status--pendiente';

    return `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${new Date(o.createdAt).toLocaleString('es-AR')}</td>
        <td>
          <div style="font-weight:700">${o.customer.firstName} ${o.customer.lastName}</div>
          <div style="font-size:0.75rem;color:#64748B">${o.customer.phone}</div>
        </td>
        <td>${o.items ? o.items.length : 0} ítems (${o.totals?.totalUnits || 0} un.)</td>
        <td><strong style="font-size:0.95rem;color:#0F172A">$${(o.totals?.total || 0).toLocaleString('es-AR')}</strong></td>
        <td><span class="status-badge ${sClass}">${o.status || 'Pendiente'}</span></td>
        <td>
          <select class="form-select form-select-sm" data-action="change-order-status" data-id="${o.id}">
            ${['Pendiente', 'Confirmado', 'Preparando', 'Listo', 'Enviado', 'Entregado', 'Cancelado'].map(st => `
              <option value="${st}" ${o.status === st ? 'selected' : ''}>${st}</option>
            `).join('')}
          </select>
        </td>
        <td>
          <a href="${WhatsAppService.getOrderWhatsAppUrl(o)}" target="_blank" class="btn btn--success btn--sm" title="Abrir chat en WhatsApp">
            💬 WhatsApp
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================
// 8. RENTABILIDAD (SECCIÓN 9)
// ============================================================
function renderProfitabilityView() {
  const rep = AdminService.getMonthlyReport(new Date().getFullYear(), new Date().getMonth());

  document.getElementById('prof-stat-revenue').textContent = `$${rep.sales.toLocaleString('es-AR')}`;
  document.getElementById('prof-stat-cogs').textContent = `$${rep.costs.toLocaleString('es-AR')}`;
  document.getElementById('prof-stat-gross-profit').textContent = `$${rep.grossProfit.toLocaleString('es-AR')}`;
  document.getElementById('prof-stat-margin-pct').textContent = `${rep.marginPercent}%`;
  document.getElementById('prof-stat-avg-ticket').textContent = `$${rep.avgTicket.toLocaleString('es-AR')}`;

  // Desglose por categoría
  AdminCharts.renderCategoryBreakdown('profitability-category-breakdown', rep.categoryBreakdown);
}

// ============================================================
// 9. REPORTE SEMANAL COMPARATIVO (SECCIÓN 10)
// ============================================================
function renderWeeklyReportView() {
  const rep = AdminService.getWeeklyReport();

  document.getElementById('wrep-sales').textContent = `$${rep.current.sales.toLocaleString('es-AR')}`;
  document.getElementById('wrep-costs').textContent = `$${rep.current.costs.toLocaleString('es-AR')}`;
  document.getElementById('wrep-profit').textContent = `$${rep.current.profit.toLocaleString('es-AR')}`;
  document.getElementById('wrep-margin').textContent = `${rep.current.margin.toFixed(1)}%`;
  document.getElementById('wrep-orders').textContent = rep.current.orders;
  document.getElementById('wrep-units').textContent = rep.current.units;
  document.getElementById('wrep-avg-ticket').textContent = `$${rep.current.avgTicket.toLocaleString('es-AR')}`;

  document.getElementById('wrep-var-sales').textContent = `${rep.variations.salesPercent}% vs semana ant.`;
  document.getElementById('wrep-var-profit').textContent = `${rep.variations.profitPercent}% vs semana ant.`;

  // Top productos de la semana por volumen
  const topUnitsBody = document.getElementById('wrep-top-units-body');
  if (topUnitsBody) {
    topUnitsBody.innerHTML = rep.topByUnits.map((item, idx) => `
      <tr>
        <td><strong>${idx + 1}</strong></td>
        <td>${item.name}</td>
        <td><strong>${item.units} un.</strong></td>
        <td>$${item.revenue.toLocaleString('es-AR')}</td>
      </tr>
    `).join('');
  }

  // Top productos de la semana por ganancia
  const topProfitBody = document.getElementById('wrep-top-profit-body');
  if (topProfitBody) {
    topProfitBody.innerHTML = rep.topByProfit.map((item, idx) => `
      <tr>
        <td><strong>${idx + 1}</strong></td>
        <td>${item.name}</td>
        <td style="color:#10B981;font-weight:700">+$${item.profit.toLocaleString('es-AR')}</td>
        <td>$${item.revenue.toLocaleString('es-AR')}</td>
      </tr>
    `).join('');
  }
}

// ============================================================
// 10. REPORTE MENSUAL COMPARATIVO (SECCIÓN 11)
// ============================================================
function renderMonthlyReportView() {
  const now = new Date();
  const yearSelect = document.getElementById('mrep-year-select');
  const monthSelect = document.getElementById('mrep-month-select');

  const year = yearSelect ? parseInt(yearSelect.value, 10) : now.getFullYear();
  const month = monthSelect ? parseInt(monthSelect.value, 10) : now.getMonth();

  const rep = AdminService.getMonthlyReport(year, month);

  document.getElementById('mrep-sales').textContent = `$${rep.sales.toLocaleString('es-AR')}`;
  document.getElementById('mrep-costs').textContent = `$${rep.costs.toLocaleString('es-AR')}`;
  document.getElementById('mrep-profit').textContent = `$${rep.grossProfit.toLocaleString('es-AR')}`;
  document.getElementById('mrep-margin').textContent = `${rep.marginPercent}%`;
  document.getElementById('mrep-orders').textContent = rep.orders;
  document.getElementById('mrep-units').textContent = rep.units;

  // Gráfico diario del mes
  const days = Object.keys(rep.dailySales);
  const values = Object.values(rep.dailySales);

  AdminCharts.renderLineChart('mrep-chart-daily-sales', {
    labels: days.length > 0 ? days.map(d => `Día ${d}`) : ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    data: values.length > 0 ? values : [1100000, 1250000, 1380000, 1120000],
    height: 220,
    color: '#2563EB'
  });
}

// ============================================================
// 11. PROVEEDORES (SECCIÓN 12)
// ============================================================
function renderSuppliersView() {
  const suppliers = AdminService.getSuppliers();
  const tbody = document.getElementById('suppliers-table-body');
  if (!tbody) return;

  tbody.innerHTML = suppliers.map(s => `
    <tr>
      <td><code>${s.id}</code></td>
      <td><strong>${s.name}</strong></td>
      <td><code>${s.cuit}</code></td>
      <td>${s.contact}</td>
      <td>${s.phone}</td>
      <td>${s.email}</td>
      <td><span class="badge badge--nuevo">${s.categories.join(', ')}</span></td>
      <td><strong>$${(s.totalPurchasesARS || 0).toLocaleString('es-AR')}</strong></td>
      <td>${s.receiptsCount || 0}</td>
      <td>${s.lastReceiptDate ? new Date(s.lastReceiptDate).toLocaleDateString('es-AR') : '—'}</td>
    </tr>
  `).join('');
}

// ============================================================
// 12. CLIENTES (SECCIÓN 14)
// ============================================================
function renderCustomersView() {
  const customers = AdminService.getCustomers();
  const tbody = document.getElementById('customers-table-body');
  if (!tbody) return;

  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;color:#94A3B8">Sin clientes registrados aún.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td>${c.phone}</td>
      <td>${c.city}</td>
      <td><span class="status-badge status--confirmado">${c.ordersCount} pedidos</span></td>
      <td><strong>$${c.totalSpent.toLocaleString('es-AR')}</strong></td>
      <td>$${c.avgTicket.toLocaleString('es-AR')}</td>
      <td>${new Date(c.lastOrderDate).toLocaleDateString('es-AR')}</td>
    </tr>
  `).join('');
}

// ============================================================
// 13. EXPORTACIÓN DE REPORTES (CSV, EXCEL, PDF)
// ============================================================
function exportTableToCSV(filename, tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  let csv = [];
  const rows = table.querySelectorAll('tr');

  for (let i = 0; i < rows.length; i++) {
    let row = [], cols = rows[i].querySelectorAll('td, th');
    for (let j = 0; j < cols.length; j++) {
      let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s+)/gm, ' ');
      data = data.replace(/"/g, '""');
      row.push('"' + data + '"');
    }
    csv.push(row.join(','));
  }

  const csvFile = new Blob(["\uFEFF" + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

// ============================================================
// EVENTOS GLOBALES Y DELEGACIÓN
// ============================================================
function setupGlobalEvents() {
  // Delegación de clics en tablas
  document.addEventListener('click', (e) => {
    const detailBtn = e.target.closest('[data-action="view-product-detail"]');
    if (detailBtn) {
      openProductDetailModal(detailBtn.dataset.id);
      return;
    }

    const editPriceBtn = e.target.closest('[data-action="quick-edit-price"]');
    if (editPriceBtn) {
      openProductDetailModal(editPriceBtn.dataset.id);
      return;
    }

    const adjustStockBtn = e.target.closest('[data-action="adjust-stock"]');
    if (adjustStockBtn) {
      openStockAdjustModal(adjustStockBtn.dataset.id);
      return;
    }

    // Botón Revisar Precio en tarjeta de menor margen
    const lowMarginReviewBtn = e.target.closest('#btn-open-low-margin-review');
    if (lowMarginReviewBtn) {
      openLowMarginReviewModal();
      return;
    }

    // Clic en ítem individual del ranking de menor margen
    const lowMarginItem = e.target.closest('[data-action="review-product-margin"]');
    if (lowMarginItem) {
      openLowMarginReviewModal(lowMarginItem.dataset.id);
      return;
    }

    // Cerrar banner de feedback de ingreso
    const closeFeedbackBtn = e.target.closest('#btn-close-receipt-feedback');
    if (closeFeedbackBtn) {
      const banner = document.getElementById('receipt-feedback-banner');
      if (banner) banner.style.display = 'none';
      return;
    }

    // Ir a historial desde tabla de sesión de ingreso
    const gotoHistoryBtn = e.target.closest('#btn-goto-history');
    if (gotoHistoryBtn) {
      switchTab('historial');
      return;
    }

    const closeModalBtn = e.target.closest('[data-close-modal]');
    if (closeModalBtn) {
      closeModal(closeModalBtn.dataset.closeModal);
      return;
    }
  });

  // Cambio de estado de pedido
  document.addEventListener('change', (e) => {
    const statusSelect = e.target.closest('[data-action="change-order-status"]');
    if (statusSelect) {
      try {
        const orderId = statusSelect.dataset.id;
        const newStatus = statusSelect.value;
        AdminService.updateOrderStatus(orderId, newStatus, AdminService.getCurrentRole());
        showToast(`Pedido #${orderId} actualizado a estado "${newStatus}"`, 'success');
        renderOrdersView();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    }
  });

  // Filtros de Productos
  const searchInput = document.getElementById('products-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.productsFilter.search = e.target.value;
      renderProductsView();
    });
  }

  const sectionSelect = document.getElementById('products-section-select');
  if (sectionSelect) {
    sectionSelect.addEventListener('change', (e) => {
      state.productsFilter.section = e.target.value;
      renderProductsView();
    });
  }

  const stockSelect = document.getElementById('products-stock-select');
  if (stockSelect) {
    stockSelect.addEventListener('change', (e) => {
      state.productsFilter.stockStatus = e.target.value;
      renderProductsView();
    });
  }

  // Botón Actualización Masiva de Precios
  const bulkPriceBtn = document.getElementById('btn-open-bulk-price-modal');
  if (bulkPriceBtn) {
    bulkPriceBtn.addEventListener('click', openBulkPriceModal);
  }

  // Botón Nuevo Producto
  const newProdBtn = document.getElementById('btn-open-new-product-modal');
  if (newProdBtn) {
    newProdBtn.addEventListener('click', () => {
      openModal('modal-new-product');
    });
  }

  // Formulario Nuevo Producto
  const newProdForm = document.getElementById('form-new-product');
  if (newProdForm) {
    newProdForm.onsubmit = (e) => {
      e.preventDefault();
      try {
        AdminService.saveNewProduct({
          name: document.getElementById('newp-name').value.trim(),
          brand: document.getElementById('newp-brand').value.trim(),
          section: document.getElementById('newp-section').value,
          unit: document.getElementById('newp-unit').value,
          packagePresentation: document.getElementById('newp-presentation').value.trim(),
          cost: parseFloat(document.getElementById('newp-cost').value),
          price: parseFloat(document.getElementById('newp-price').value),
          stock: parseInt(document.getElementById('newp-stock').value, 10),
          minStock: parseInt(document.getElementById('newp-minstock').value, 10),
          description: document.getElementById('newp-desc').value.trim()
        }, AdminService.getCurrentRole());

        newProdForm.reset();
        closeModal('modal-new-product');
        renderProductsView();
        showToast('Producto creado y agregado al catálogo mayorista', 'success');
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }

  // Botón Nuevo Proveedor
  const newSupBtn = document.getElementById('btn-open-new-supplier-modal');
  if (newSupBtn) {
    newSupBtn.addEventListener('click', () => {
      openModal('modal-new-supplier');
    });
  }

  // Formulario Nuevo Proveedor
  const newSupForm = document.getElementById('form-new-supplier');
  if (newSupForm) {
    newSupForm.onsubmit = (e) => {
      e.preventDefault();
      try {
        AdminService.saveSupplier({
          name: document.getElementById('newsup-name').value.trim(),
          cuit: document.getElementById('newsup-cuit').value.trim(),
          contact: document.getElementById('newsup-contact').value.trim(),
          phone: document.getElementById('newsup-phone').value.trim(),
          email: document.getElementById('newsup-email').value.trim(),
          address: document.getElementById('newsup-address').value.trim(),
          categories: [document.getElementById('newsup-category').value]
        });

        newSupForm.reset();
        closeModal('modal-new-supplier');
        renderSuppliersView();
        showToast('Proveedor registrado exitosamente', 'success');
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }

  // Filtros de Movimientos
  const movTypeSelect = document.getElementById('movements-type-select');
  if (movTypeSelect) {
    movTypeSelect.addEventListener('change', (e) => {
      state.movementsFilter.type = e.target.value;
      renderMovementsView();
    });
  }

  const movPresetSelect = document.getElementById('movements-date-select');
  if (movPresetSelect) {
    movPresetSelect.addEventListener('change', (e) => {
      state.movementsFilter.datePreset = e.target.value;
      renderMovementsView();
    });
  }

  // Botones de Exportación
  document.querySelectorAll('[data-export]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.export;
      const targetTable = btn.dataset.targetTable || 'products-data-table';
      const filename = `${targetTable}_${new Date().toISOString().slice(0, 10)}.csv`;

      if (type === 'csv' || type === 'excel') {
        exportTableToCSV(filename, targetTable);
        showToast(`Reporte exportado como ${filename}`, 'success');
      } else if (type === 'pdf') {
        window.print();
      }
    });
  });
}

// Helpers de Modales y Notificaciones
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('is-open');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('is-open');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `smart-alert alert--${type}`;
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.right = '2rem';
  toast.style.zIndex = '9999';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
  toast.style.transition = 'all 0.3s ease';
  toast.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${message}`;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
