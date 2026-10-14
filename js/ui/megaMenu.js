/**
 * MEGA MENÚ DE CATEGORÍAS — Mayorista a tu Casa
 * Una iniciativa de AdminYAAA
 * Estilo supermercado mayorista (Club de Beneficios / DIA / Carrefour)
 * Navegación en 2 columnas: Departamentos a la izquierda y subcategorías a la derecha
 */

import { SECTIONS } from '../data/categories.js';

export const MegaMenu = {
  isOpen: false,
  activeKey: 'combos', // 'ofertas', 'combos', 'almacen', etc.
  onSelectCallback: null,

  // Definición de departamentos enriquecidos para el Mega Menú
  menuItems: [
    {
      key: 'ofertas',
      type: 'special',
      isPromo: true,
      title: 'OFERTAS IMPERDIBLES',
      icon: '🔥',
      badge: 'Precios Bomba',
      subtitle: 'Oportunidades destacadas de la semana con precios especiales por volumen',
      anchor: '#ofertas',
      subcategories: [
        { name: 'Ofertas Bomba de la Semana', anchor: '#ofertas' },
        { name: 'Descuentos por Bulto Cerrado', anchor: '#ofertas' },
        { name: 'Promociones Especiales en Almacén', section: 'Almacén' },
        { name: 'Promociones en Limpieza y Hogar', section: 'Limpieza del hogar' },
        { name: 'Promociones en Desayuno y Merienda', section: 'Desayuno y merienda' }
      ],
      allLabel: 'Ver todas las Ofertas Bomba →',
      allTarget: { anchor: '#ofertas' }
    },
    {
      key: 'combos',
      type: 'special',
      isPromo: false,
      title: 'Combos Ahorro',
      icon: '📦',
      badge: 'Sugeridos',
      subtitle: 'Armados equilibrados para tu despensa, comercio o familia con hasta 25% de ahorro',
      anchor: '#combos',
      subcategories: [
        { name: 'Combos de Limpieza del Hogar', anchor: '#combos' },
        { name: 'Combos de Almacén y Despensa', anchor: '#combos' },
        { name: 'Combos de Bebidas y Refrescos', anchor: '#combos' },
        { name: 'Combos de Desayuno y Merienda', anchor: '#combos' },
        { name: 'Combos Familiares Grandes', anchor: '#combos' },
        { name: 'Mini Combos de Ahorro', anchor: '#combos' },
        { name: 'Combos Especiales para PyMEs', anchor: '#combos' }
      ],
      allLabel: 'Ver todos los Combos Sugeridos →',
      allTarget: { anchor: '#combos' }
    },
    {
      key: 'almacen',
      type: 'section',
      sectionName: 'Almacén',
      title: 'Almacén',
      icon: '🥫',
      subtitle: 'Aceites, fideos, arroz, harinas, conservas, salsas y legumbres',
      subcategories: [
        { name: 'Aceites y vinagre', section: 'Almacén', category: 'Aceites y vinagre' },
        { name: 'Aceitunas y conservas', section: 'Almacén', category: 'Aceitunas y conservas' },
        { name: 'Arroz', section: 'Almacén', category: 'Arroz' },
        { name: 'Atunes y pescados', section: 'Almacén', category: 'Atunes' },
        { name: 'Caldos y sopas', section: 'Almacén', category: 'Caldos' },
        { name: 'Conservas y tomates', section: 'Almacén', category: 'Conservas y tomates' },
        { name: 'Fideos y pastas', section: 'Almacén', category: 'Fideos' },
        { name: 'Harina', section: 'Almacén', category: 'Harina' },
        { name: 'Mantecas y grasas', section: 'Almacén', category: 'Mantecas y grasas' },
        { name: 'Mayonesas y aderezos', section: 'Almacén', category: 'Mayonesas' },
        { name: 'Pan rallado y rebozador', section: 'Almacén', category: 'Pan rallado' },
        { name: 'Sal y condimentos', section: 'Almacén', category: 'Sal' },
        { name: 'Varios almacén', section: 'Almacén', category: 'Varios almacén' }
      ],
      allLabel: 'Ver todo en Almacén (68 productos) →',
      allTarget: { section: 'Almacén', category: 'todas' }
    },
    {
      key: 'desayuno',
      type: 'section',
      sectionName: 'Desayuno y merienda',
      title: 'Desayuno & Merienda',
      icon: '☕',
      subtitle: 'Cafés, yerbas, tés, galletitas dulces y saladas, mermeladas y dulces',
      subcategories: [
        { name: 'Cafés', section: 'Desayuno y merienda', category: 'Cafés' },
        { name: 'Yerbas mates', section: 'Desayuno y merienda', category: 'Yerbas' },
        { name: 'Té y mate cocido', section: 'Desayuno y merienda', category: 'Té y mate cocido' },
        { name: 'Galletitas dulces y saladas', section: 'Desayuno y merienda', category: 'Galletitas' },
        { name: 'Mermeladas Emeth', section: 'Desayuno y merienda', category: 'Mermeladas Emeth' },
        { name: 'Dulce de leche', section: 'Desayuno y merienda', category: 'Dulce de leche' },
        { name: 'Alfajores', section: 'Desayuno y merienda', category: 'Alfajores' },
        { name: 'Azúcar y endulzantes', section: 'Desayuno y merienda', category: 'Azúcar y endulzantes' },
        { name: 'Dulces de corte', section: 'Desayuno y merienda', category: 'Dulces' }
      ],
      allLabel: 'Ver todo en Desayuno & Merienda (76 productos) →',
      allTarget: { section: 'Desayuno y merienda', category: 'todas' }
    },
    {
      key: 'fiambreria',
      type: 'section',
      sectionName: 'Fiambrería y quesos',
      title: 'Fiambrería & Quesos',
      icon: '🧀',
      subtitle: 'Quesos por pieza o fraccionados, jamones selectos, paletas y embutidos',
      subcategories: [
        { name: 'Quesos - Cremosos', section: 'Fiambrería y quesos', category: 'Quesos - Cremosos' },
        { name: 'Quesos - Barra / Tybo', section: 'Fiambrería y quesos', category: 'Quesos - Barra' },
        { name: 'Quesos - Muzzarella', section: 'Fiambrería y quesos', category: 'Quesos - Muzzarella' },
        { name: 'Quesos - Duros y Sardo', section: 'Fiambrería y quesos', category: 'Quesos - Duros' },
        { name: 'Quesos rallados', section: 'Fiambrería y quesos', category: 'Quesos rallados x40gr' },
        { name: 'Fiambres - Jamones', section: 'Fiambrería y quesos', category: 'Fiambres - Jamones' },
        { name: 'Fiambres - Paletas', section: 'Fiambrería y quesos', category: 'Fiambres - Paletas' },
        { name: 'Fiambres - Salames', section: 'Fiambrería y quesos', category: 'Fiambres - Salames' },
        { name: 'Fiambres - Milán', section: 'Fiambrería y quesos', category: 'Fiambres - Milán' }
      ],
      allLabel: 'Ver todo en Fiambrería & Quesos (60 productos) →',
      allTarget: { section: 'Fiambrería y quesos', category: 'todas' }
    },
    {
      key: 'limpieza',
      type: 'section',
      sectionName: 'Limpieza del hogar',
      title: 'Limpieza del Hogar',
      icon: '🧹',
      subtitle: 'Jabones para ropa, lavandinas, detergentes, suavizantes y rollos',
      subcategories: [
        { name: 'Jabones para ropa líquidos y en polvo', section: 'Limpieza del hogar', category: 'Jabones para ropa' },
        { name: 'Lavandina y limpiadores de piso', section: 'Limpieza del hogar', category: 'Lavandina y limpiadores de piso' },
        { name: 'Detergentes para vajilla', section: 'Limpieza del hogar', category: 'Limpieza - Detergentes' },
        { name: 'Rollos de cocina y papel', section: 'Limpieza del hogar', category: 'Limpieza - Rollos' },
        { name: 'Suavizantes de ropa', section: 'Limpieza del hogar', category: 'Suavizantes' },
        { name: 'Jabones en pan blanco', section: 'Limpieza del hogar', category: 'Limpieza - Jabones en pan' },
        { name: 'Insecticidas y repelentes', section: 'Limpieza del hogar', category: 'Limpieza - Insecticidas' },
        { name: 'Varios de limpieza', section: 'Limpieza del hogar', category: 'Varios limpieza' }
      ],
      allLabel: 'Ver todo en Limpieza del Hogar (38 productos) →',
      allTarget: { section: 'Limpieza del hogar', category: 'todas' }
    },
    {
      key: 'perfumeria',
      type: 'section',
      sectionName: 'Perfumería e higiene personal',
      title: 'Perfumería & Cuidado Personal',
      icon: '🧴',
      subtitle: 'Shampoos, jabones de tocador, desodorantes, cuidado oral y afeitar',
      subcategories: [
        { name: 'Shampoos y acondicionadores', section: 'Perfumería e higiene personal', category: 'Limpieza - Shampoo' },
        { name: 'Jabones de tocador', section: 'Perfumería e higiene personal', category: 'Limpieza - Jabones tocador' },
        { name: 'Desodorantes y antitranspirantes', section: 'Perfumería e higiene personal', category: 'Desodorantes' },
        { name: 'Papel higiénico y rollos', section: 'Perfumería e higiene personal', category: 'Limpieza - Higienicos' },
        { name: 'Pasta dental y cuidado bucal', section: 'Perfumería e higiene personal', category: 'Pasta dental' },
        { name: 'Máquinas de afeitar', section: 'Perfumería e higiene personal', category: 'Máquinas de afeitar' },
        { name: 'Cremas corporales', section: 'Perfumería e higiene personal', category: 'Cremas' }
      ],
      allLabel: 'Ver todo en Perfumería & Higiene (30 productos) →',
      allTarget: { section: 'Perfumería e higiene personal', category: 'todas' }
    },
    {
      key: 'bebidas',
      type: 'section',
      sectionName: 'Bebidas',
      title: 'Bebidas',
      icon: '🥤',
      subtitle: 'Jugos, vinos, aperitivos y energizantes en pack mayorista',
      subcategories: [
        { name: 'Aperitivos y vermuts', section: 'Bebidas', category: 'Aperitivos' },
        { name: 'Bebidas energizantes', section: 'Bebidas', category: 'Energizantes' },
        { name: 'Jugos listos y concentrados', section: 'Bebidas', category: 'Jugos' },
        { name: 'Vinos de mesa y finos', section: 'Bebidas', category: 'Vinos' }
      ],
      allLabel: 'Ver todo en Bebidas (15 productos) →',
      allTarget: { section: 'Bebidas', category: 'todas' }
    },
    {
      key: 'snacks',
      type: 'section',
      sectionName: 'Snacks',
      title: 'Snacks & Kiosco',
      icon: '🍿',
      subtitle: 'Papas fritas, palitos, chizitos y snacks de alta rotación',
      subcategories: [
        { name: 'Papas fritas Krachitos', section: 'Snacks', category: 'Krachitos' },
        { name: 'Snacks Good Show (palitos, chizitos, maní)', section: 'Snacks', category: 'Snacks Good Show' }
      ],
      allLabel: 'Ver todo en Snacks (16 productos) →',
      allTarget: { section: 'Snacks', category: 'todas' }
    }
  ],

  init(options = {}) {
    this.onSelectCallback = options.onSelectCategory || null;

    const triggerBtn = document.getElementById('btn-mega-categories');
    const backdrop = document.getElementById('mega-menu-backdrop');
    const dropdown = document.getElementById('header-mega-menu');

    if (!triggerBtn || !dropdown) return;

    // Click en botón disparador
    triggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    // Click en backdrop
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        this.close();
      });
    }

    // Cerrar al presionar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Cerrar si hacen click afuera
    document.addEventListener('click', (e) => {
      if (this.isOpen && !dropdown.contains(e.target) && !triggerBtn.contains(e.target)) {
        this.close();
      }
    });

    // Renderizar estructura inicial
    this.renderSidebar();
    this.renderContent(this.activeKey);

    // Abrir automáticamente si el hash es #categorias
    if (window.location.hash === '#categorias') {
      setTimeout(() => this.open(), 100);
    }
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    this.isOpen = true;
    const triggerBtn = document.getElementById('btn-mega-categories');
    const backdrop = document.getElementById('mega-menu-backdrop');
    const dropdown = document.getElementById('header-mega-menu');

    if (triggerBtn) {
      triggerBtn.classList.add('is-active');
      triggerBtn.setAttribute('aria-expanded', 'true');
      const openIcon = triggerBtn.querySelector('.icon-menu-bars');
      const closeIcon = triggerBtn.querySelector('.icon-menu-close');
      if (openIcon) openIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'inline-block';
    }

    if (backdrop) backdrop.classList.add('is-visible');
    if (dropdown) {
      dropdown.classList.add('is-visible');
      dropdown.setAttribute('aria-hidden', 'false');
    }

    // Asegurar renderizado correcto del ítem activo
    this.renderSidebar();
    this.renderContent(this.activeKey);
  },

  close() {
    this.isOpen = false;
    const triggerBtn = document.getElementById('btn-mega-categories');
    const backdrop = document.getElementById('mega-menu-backdrop');
    const dropdown = document.getElementById('header-mega-menu');

    if (triggerBtn) {
      triggerBtn.classList.remove('is-active');
      triggerBtn.setAttribute('aria-expanded', 'false');
      const openIcon = triggerBtn.querySelector('.icon-menu-bars');
      const closeIcon = triggerBtn.querySelector('.icon-menu-close');
      if (openIcon) openIcon.style.display = 'inline-block';
      if (closeIcon) closeIcon.style.display = 'none';
    }

    if (backdrop) backdrop.classList.remove('is-visible');
    if (dropdown) {
      dropdown.classList.remove('is-visible');
      dropdown.setAttribute('aria-hidden', 'true');
    }
  },

  renderSidebar() {
    const sidebar = document.getElementById('mega-menu-sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = this.menuItems.map(item => {
      const isActive = item.key === this.activeKey;
      const isPromo = item.isPromo ? 'mega-menu-cat-item--special-promo' : '';
      const isSpecial = item.type === 'special' ? 'mega-menu-cat-item--special' : '';

      return `
        <button type="button" 
                class="mega-menu-cat-item ${isSpecial} ${isPromo} ${isActive ? 'is-active' : ''}" 
                data-mega-key="${item.key}"
                aria-selected="${isActive ? 'true' : 'false'}">
          <span class="cat-label">
            <span class="cat-icon">${item.icon}</span>
            <span>${item.title}</span>
          </span>
          <span class="cat-arrow">›</span>
        </button>
      `;
    }).join('');

    // Asignar eventos de mouseover y click a los items del menú lateral
    sidebar.querySelectorAll('.mega-menu-cat-item').forEach(btn => {
      const key = btn.dataset.megaKey;
      
      btn.addEventListener('mouseenter', () => {
        this.setActiveItem(key);
      });

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveItem(key);
      });
    });
  },

  setActiveItem(key) {
    this.activeKey = key;

    // Actualizar clases activas en sidebar
    const sidebar = document.getElementById('mega-menu-sidebar');
    if (sidebar) {
      sidebar.querySelectorAll('.mega-menu-cat-item').forEach(btn => {
        const isCurrent = btn.dataset.megaKey === key;
        btn.classList.toggle('is-active', isCurrent);
        btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });
    }

    this.renderContent(key);
  },

  renderContent(key) {
    const content = document.getElementById('mega-menu-content');
    if (!content) return;

    const item = this.menuItems.find(it => it.key === key) || this.menuItems[0];

    let subcatsHtml = '';
    if (item.subcategories && item.subcategories.length > 0) {
      subcatsHtml = item.subcategories.map(sub => {
        return `
          <a href="#" 
             class="mega-menu-subcat-link" 
             data-action="select-subcat"
             data-section="${sub.section || ''}" 
             data-category="${sub.category || ''}"
             data-anchor="${sub.anchor || ''}">
            <span>${sub.name}</span>
          </a>
        `;
      }).join('');
    }

    content.innerHTML = `
      <div class="mega-menu-content-header">
        <h3 class="mega-menu-title">${item.icon} ${item.title}</h3>
        <p class="mega-menu-subtitle">${item.subtitle || ''}</p>
      </div>

      <div class="mega-menu-subcategories-list">
        ${subcatsHtml}
      </div>

      <a href="#" 
         class="mega-menu-all-link" 
         data-action="select-all"
         data-section="${item.allTarget?.section || ''}"
         data-category="${item.allTarget?.category || 'todas'}"
         data-anchor="${item.allTarget?.anchor || ''}">
        <span>${item.allLabel || 'Ver todo →'}</span>
      </a>
    `;

    // Vincular clicks dentro de la columna derecha
    content.querySelectorAll('[data-action="select-subcat"], [data-action="select-all"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        const category = link.dataset.category;
        const anchor = link.dataset.anchor;

        this.close();

        if (this.onSelectCallback) {
          this.onSelectCallback({ section, category, anchor });
        }
      });
    });
  }
};
