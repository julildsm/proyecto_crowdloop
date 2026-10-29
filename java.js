/**
 * java.js — Lógica de interacción · Portal SGCS · Crowd Loop · Sprint 1
 * ---------------------------------------------------------------------------
 * Un único archivo con un módulo por Historia de Usuario. Cada módulo se
 * inicializa solo si encuentra sus elementos en la página, así que el mismo
 * script se puede cargar en todas las vistas sin errores.
 *
 *   Transversal  Utilidades, avisos ("toast"), buscador del encabezado
 *   US-01        Menú hamburguesa dinámico            → initNavigation()
 *   US-02        Pestañas (tabs) y acordeón           → initTabs(), initAccordions()
 *   US-03        Tarjetas interactivas (flip-cards)   → initFlipCards()
 *   US-04        Filtro en tiempo real por categoría  → initToolFilter()
 *   US-05        Línea de tiempo con iluminación      → initTimeline()
 *   US-06        Navegación interna por subsecciones  → initQuickNav()
 */
(function () {
  'use strict';

  /* ==========================================================================
     UTILIDADES
     ========================================================================== */

  /** Atajos para seleccionar elementos. */
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  /**
   * Normaliza un texto para comparar: minúsculas y sin tildes.
   * Permite que "calidad" coincida con "Calidád" o "CALIDAD".
   */
  function normalize(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  /* ==========================================================================
     AVISO ("TOAST") Y ENLACES "PRÓXIMAMENTE"
     Los enlaces con el atributo data-coming-soon apuntan a páginas que aún no
     existen (Metodologías, Glosario, Aviso Legal…). Muestran un aviso en lugar
     de una página 404. Cuando la página exista, se quita el atributo.
     ========================================================================== */

  let toastTimer;

  function initComingSoonLinks() {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status'); // se anuncia en lectores de pantalla
    document.body.appendChild(toast);

    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-coming-soon]');
      if (!link) return;
      event.preventDefault();
      toast.textContent = 'Esta sección estará disponible próximamente.';
      toast.classList.add('is-visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
    });
  }

  /* ==========================================================================
     US-01 · MENÚ HAMBURGUESA DINÁMICO
     - Botón .nav-toggle abre/cierra el panel #site-nav (visible hasta 1024px).
     - Mantiene sincronizados aria-expanded y aria-label (accesibilidad).
     - Se cierra con: clic en un enlace, tecla Escape, clic fuera del menú
       o al agrandar la ventana hasta el modo escritorio.
     ========================================================================== */

  function initNavigation() {
    const toggle = $('.nav-toggle');
    const nav = $('#site-nav');
    if (!toggle || !nav) return;

    const desktopQuery = window.matchMedia('(min-width: 1025px)');

    /** Abre o cierra el menú y actualiza los atributos ARIA. */
    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    }

    toggle.addEventListener('click', () => {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Cerrar al navegar (los enlaces "próximamente" no navegan: el menú sigue abierto)
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a:not([data-coming-soon])')) setMenu(false);
    });

    // Cerrar con Escape y devolver el foco al botón
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Cerrar al hacer clic fuera del encabezado
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.site-header')) setMenu(false);
    });

    // Al pasar a escritorio, el menú vuelve a su estado normal
    desktopQuery.addEventListener('change', (event) => {
      if (event.matches) setMenu(false);
    });
  }

  /* ==========================================================================
     BUSCADOR DEL ENCABEZADO
     Búsqueda simple sobre un índice estático de páginas y secciones.
     Al escribir muestra hasta 6 resultados; Enter abre el primero.
     ========================================================================== */

  const SEARCH_INDEX = [
    { title: 'Inicio', url: 'index.html', keywords: 'portal principal tarjetas sobre nosotros equipo' },
    { title: 'Fundamentos de calidad', url: 'fundamentos.html', keywords: 'calidad normas iso 9126 25000 25010 metricas' },
    { title: 'Norma ISO/IEC 9126', url: 'fundamentos.html#tab-iso9126', keywords: 'funcionalidad fiabilidad usabilidad eficiencia mantenibilidad portabilidad' },
    { title: 'Norma ISO/IEC 25000 (SQuaRE)', url: 'fundamentos.html#tab-iso25000', keywords: '25010 seguridad compatibilidad calidad en uso squere' },
    { title: 'Métricas de calidad', url: 'fundamentos.html#tab-metricas', keywords: 'metricas complejidad ciclomatica densidad defectos mtbf cobertura' },
    { title: 'Técnicas de aseguramiento de calidad', url: 'tecnicas.html', keywords: 'verificacion validacion revision inspeccion walkthrough caja blanca negra auditoria' },
    { title: 'Herramientas de calidad', url: 'herramientas.html', keywords: 'selenium jira sonarqube git jenkins jmeter cypress postman junit eslint' },
    { title: 'Ciclo de vida del software (SDLC)', url: 'sdlc.html', keywords: 'sdlc planificacion requisitos diseno implementacion pruebas despliegue mantenimiento linea de tiempo' },
    { title: 'Scrum framework', url: 'metodologias.html#scrum-title', keywords: 'scrum roles eventos events artefactos product owner scrum master developers sprint daily retrospectiva backlog increment' },
    { title: 'Kanban board', url: 'metodologias.html#kanban-title', keywords: 'kanban tablero wip flujo columnas tarjetas limite' },
    { title: 'Modelos tradicionales de desarrollo', url: 'sdlc.html#models-title', keywords: 'cascada modelo en v iterativo ventajas desventajas esquema' }
  ];

  function initSearch() {
    const form = $('.site-search');
    const input = $('.site-search input');
    if (!form || !input) return;

    // Lista de resultados creada dinámicamente
    const list = document.createElement('ul');
    list.className = 'search-results';
    list.id = 'search-results';
    list.hidden = true;
    form.appendChild(list);

    /** Devuelve las entradas del índice que contienen todos los términos escritos. */
    function search(query) {
      const terms = normalize(query).split(/\s+/).filter(Boolean);
      if (!terms.length) return [];
      return SEARCH_INDEX.filter((entry) => {
        const haystack = normalize(entry.title + ' ' + entry.keywords);
        return terms.every((term) => haystack.includes(term));
      }).slice(0, 6);
    }

    function render(results, query) {
      list.innerHTML = '';
      if (!query.trim()) { list.hidden = true; return; }
      if (!results.length) {
        const li = document.createElement('li');
        li.className = 'no-results';
        li.textContent = 'Sin resultados. Prueba con otra palabra.';
        list.appendChild(li);
      } else {
        results.forEach((entry) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = entry.url;
          a.textContent = entry.title;
          li.appendChild(a);
          list.appendChild(li);
        });
      }
      list.hidden = false;
    }

    input.addEventListener('input', () => render(search(input.value), input.value));

    // Enter abre el primer resultado
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const first = search(input.value)[0];
      if (first) window.location.href = first.url;
    });

    // Escape limpia; clic fuera cierra la lista
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { input.value = ''; list.hidden = true; }
    });
    document.addEventListener('click', (event) => {
      if (!form.contains(event.target)) list.hidden = true;
    });
  }

  /* ==========================================================================
     US-02 · PESTAÑAS (TABS)
     Patrón ARIA "tabs": role=tablist / tab / tabpanel.
     - Clic o teclado (← → Inicio Fin) para cambiar de pestaña.
     - Solo la pestaña activa está en el orden de tabulación (roving tabindex).
     - Admite enlaces directos: fundamentos.html#tab-iso25000
     ========================================================================== */

  function initTabs() {
    const groups = $$('[data-tabs]');
    if (!groups.length) return;

    groups.forEach((root) => {
      const tabs = $$('[role="tab"]', root);
      const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

      /** Activa una pestaña y muestra únicamente su panel. */
      function activate(tab, moveFocus) {
        tabs.forEach((current, index) => {
          const isActive = current === tab;
          current.setAttribute('aria-selected', String(isActive));
          current.tabIndex = isActive ? 0 : -1;
          panels[index].hidden = !isActive;
        });
        if (moveFocus) tab.focus();
      }

      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activate(tab, false));

        tab.addEventListener('keydown', (event) => {
          let target = null;
          if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
          if (event.key === 'ArrowLeft') target = tabs[(index - 1 + tabs.length) % tabs.length];
          if (event.key === 'Home') target = tabs[0];
          if (event.key === 'End') target = tabs[tabs.length - 1];
          if (target) {
            event.preventDefault();
            activate(target, true);
          }
        });
      });

      /** Si la URL trae #id de una pestaña, se abre esa pestaña. */
      function applyHash() {
        const match = tabs.find((tab) => tab.id === window.location.hash.slice(1));
        if (match) activate(match, false);
      }
      applyHash();
      window.addEventListener('hashchange', applyHash);
    });
  }

  /* ==========================================================================
     US-02 · ACORDEÓN
     Cada .acc-trigger controla un panel (aria-controls). Con el atributo
     data-single en el contenedor, solo un ítem puede estar abierto a la vez.
     ========================================================================== */

  function setAccordionItem(trigger, open) {
    trigger.setAttribute('aria-expanded', String(open));
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (panel) panel.hidden = !open;
  }

  function initAccordions() {
    $$('[data-accordion]').forEach((accordion) => {
      const single = accordion.hasAttribute('data-single');

      accordion.addEventListener('click', (event) => {
        const trigger = event.target.closest('.acc-trigger');
        if (!trigger || !accordion.contains(trigger)) return;

        const willOpen = trigger.getAttribute('aria-expanded') !== 'true';
        if (single) {
          $$('.acc-trigger[aria-expanded="true"]', accordion).forEach((other) => setAccordionItem(other, false));
        }
        setAccordionItem(trigger, willOpen);
      });
    });
  }

  /* ==========================================================================
     TARJETA RESUMEN DE GESTIÓN DE CALIDAD (US-03 + US-04, filtro en fundamentos.html)
     Cada botón "Filtrar" de la tarjeta resumen es un interruptor: al activarse
     (o desactivarse) se agrega o se quita su descripción del panel de
     resultados. Varios pueden estar activos a la vez.
     ========================================================================== */

  const QUALITY_FILTER_DATA = {
    'caja-negra': { title: 'Pruebas de Caja Negra', desc: 'Se comprueban entradas y salidas sin mirar el código. Parten de los requisitos y usan partición de equivalencia y valores límite.' },
    'caja-blanca': { title: 'Pruebas de Caja Blanca', desc: 'Se prueba la estructura interna: caminos, condiciones y bucles. Se mide con cobertura de sentencias y de decisiones.' },
    'bug-trackers': { title: 'Bug Trackers', desc: 'Registran, priorizan y hacen seguimiento de los defectos encontrados durante las pruebas (por ejemplo, Jira).' },
    'linters': { title: 'Linters', desc: 'Analizan el código para encontrar errores y hacer cumplir un estilo común antes de ejecutarlo (por ejemplo, ESLint).' },
    'test-management': { title: 'Test Management', desc: 'Organizan casos de prueba, planes de ejecución y resultados en un solo lugar (por ejemplo, TestLink).' }
  };

  function initQualityFilters() {
    const buttons = $$('[data-filter-item]');
    const results = $('#quality-filter-results');
    if (!buttons.length || !results) return;

    /** Vuelve a pintar el panel con la descripción de cada botón activo. */
    function render() {
      const selected = buttons.filter((button) => button.getAttribute('aria-pressed') === 'true');

      if (!selected.length) {
        results.innerHTML = '<p class="filter-hint">Elegí una o más categorías para ver el detalle.</p>';
        return;
      }

      results.innerHTML = selected
        .map((button) => QUALITY_FILTER_DATA[button.dataset.filterItem])
        .map((item) => '<article class="filter-result-item"><h4>' + item.title + '</h4><p>' + item.desc + '</p></article>')
        .join('');
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const active = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(active));

        const card = button.closest('.mini-card');
        if (card) card.classList.toggle('is-active', active);

        render();
      });
    });

    render();
  }

  /* ==========================================================================
     US-03 · TARJETAS INTERACTIVAS (FLIP-CARDS)
     - Clic en la tarjeta (o en sus botones, con teclado) la voltea.
     - La cara oculta se marca como "inert" para que no reciba foco ni la lea
       un lector de pantalla.
     - Botón "Voltear todas" para revisar el contenido completo.
     ========================================================================== */

  function initFlipCards() {
    const cards = $$('.flip-card');
    if (!cards.length) return;

    /** Muestra la cara frontal (flipped=false) o el reverso (flipped=true). */
    function setFlipped(card, flipped) {
      card.classList.toggle('is-flipped', flipped);
      $('.flip-front', card).inert = flipped;
      $('.flip-back', card).inert = !flipped;
    }

    cards.forEach((card) => {
      setFlipped(card, false);

      card.addEventListener('click', (event) => {
        const flipped = !card.classList.contains('is-flipped');
        setFlipped(card, flipped);

        // Si se usó un botón (teclado), el foco pasa al botón de la cara visible
        if (event.target.closest('button')) {
          const visibleFace = $(flipped ? '.flip-back' : '.flip-front', card);
          $('button', visibleFace).focus();
        }
      });
    });

    // Botón "Voltear todas / Volver todas"
    const flipAll = $('#flip-all');
    if (flipAll) {
      flipAll.addEventListener('click', () => {
        const flipAllOn = cards.some((card) => !card.classList.contains('is-flipped'));
        cards.forEach((card) => setFlipped(card, flipAllOn));
        flipAll.textContent = flipAllOn ? 'Volver todas' : 'Voltear todas';
      });
    }
  }

  /* ==========================================================================
     US-04 · FILTRO INTERACTIVO EN TIEMPO REAL
     Combina dos criterios: categoría (botones) y texto (buscador).
     Cada tarjeta declara su categoría con data-category="slug".
     Se actualiza el contador (aria-live) y un mensaje si no hay resultados.
     ========================================================================== */

  function initToolFilter() {
    const grid = $('[data-filter-grid]');
    if (!grid) return;

    const items = $$('[data-category]', grid);
    const buttons = $$('[data-filter]');
    const searchInput = $('#tool-search');
    const counter = $('#filter-count');
    const emptyState = $('#filter-empty');
    const clearButton = $('#filter-clear');

    let activeCategory = 'todas';

    /** Muestra u oculta cada tarjeta según categoría + texto. */
    function applyFilter() {
      const query = normalize(searchInput ? searchInput.value : '');
      let visible = 0;

      items.forEach((item) => {
        const matchesCategory = activeCategory === 'todas' || item.dataset.category === activeCategory;
        const matchesText = !query || normalize(item.textContent).includes(query);
        const show = matchesCategory && matchesText;
        item.hidden = !show;
        if (show) visible += 1;
      });

      counter.textContent = visible === 1 ? '1 herramienta' : visible + ' herramientas';
      emptyState.hidden = visible !== 0;
    }

    /** Selecciona una categoría y actualiza aria-pressed en los botones. */
    function setCategory(category) {
      activeCategory = category;
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
      applyFilter();
    }

    buttons.forEach((button) => button.addEventListener('click', () => setCategory(button.dataset.filter)));
    if (searchInput) searchInput.addEventListener('input', applyFilter);
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        setCategory('todas');
      });
    }

    applyFilter();
  }

  /* ==========================================================================
     US-05 · LÍNEA DE TIEMPO SDLC
     - Cada fase se expande/contrae y se ilumina al activarse.
     - Al desplazar la página, una línea de progreso se "llena" y los
       marcadores por los que pasa se iluminan suavemente.
     - El scroll se procesa con requestAnimationFrame para no perder fluidez.
     ========================================================================== */

  function initTimeline() {
    const timeline = $('[data-timeline]');
    if (!timeline) return;

    const items = $$('.tl-item', timeline);

    /** Expande o contrae una fase. */
    function setItem(item, open) {
      const button = $('.tl-toggle', item);
      button.setAttribute('aria-expanded', String(open));
      $('.tl-body', item).hidden = !open;
      item.classList.toggle('is-active', open);
    }

    items.forEach((item) => {
      const button = $('.tl-toggle', item);
      button.addEventListener('click', () => setItem(item, button.getAttribute('aria-expanded') !== 'true'));
    });

    // Botón "Expandir todas / Contraer todas"
    const toggleAll = $('#tl-toggle-all');
    if (toggleAll) {
      toggleAll.addEventListener('click', () => {
        const openAll = items.some((item) => $('.tl-toggle', item).getAttribute('aria-expanded') !== 'true');
        items.forEach((item) => setItem(item, openAll));
        toggleAll.textContent = openAll ? 'Contraer todas' : 'Expandir todas';
      });
    }

    /** Calcula el avance (0–1) de la línea y enciende los marcadores alcanzados. */
    function updateProgress() {
      const rect = timeline.getBoundingClientRect();
      const focusLine = window.innerHeight * 0.55; // altura de la pantalla donde "ilumina"
      const progress = Math.min(Math.max((focusLine - rect.top) / rect.height, 0), 1);
      timeline.style.setProperty('--progress', progress.toFixed(4));

      items.forEach((item) => {
        const markerTop = $('.tl-marker', item).getBoundingClientRect().top;
        item.classList.toggle('is-lit', markerTop < focusLine);
      });
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateProgress();
  }

  /* ==========================================================================
     US-06 · NAVEGACIÓN INTERNA RÁPIDA POR SUBSECCIONES
     - Las anclas (#cascada, #modelo-v…) hacen scroll suave (ver CSS).
     - IntersectionObserver detecta la subsección visible y marca su enlace
       con aria-current, centrando el botón en la barra en móviles.
     ========================================================================== */

  function initQuickNav() {
    const nav = $('[data-quicknav]');
    if (!nav) return;

    const links = $$('a[href^="#"]', nav);
    const sections = links
      .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
      .filter(Boolean);

    /** Marca como actual el enlace de la sección indicada. */
    function setCurrent(id) {
      links.forEach((link) => {
        if (link.getAttribute('href') === '#' + id) {
          link.setAttribute('aria-current', 'true');
          // Centra el botón activo dentro de la barra horizontal
          nav.scrollTo({ left: link.offsetLeft - nav.clientWidth / 2 + link.clientWidth / 2, behavior: 'smooth' });
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    // Franja de detección: entre el 35% y el 40% de la altura de la ventana
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, { rootMargin: '-35% 0px -60% 0px' });

    sections.forEach((section) => observer.observe(section));

    // Respuesta inmediata al clic (sin esperar al observer)
    links.forEach((link) => link.addEventListener('click', () => setCurrent(link.getAttribute('href').slice(1))));
  }

  /* ==========================================================================
     US-10 · BOTÓN "VER DETALLES" (Scrum)
     Abre (o cierra) todos los acordeones del panel de pestaña visible.
     Al cambiar de pestaña el botón vuelve a su texto inicial.
     ========================================================================== */

  function initExpandAll() {
    $$('[data-expand-all]').forEach((button) => {
      const root = button.closest('.method-card');
      if (!root) return;

      button.addEventListener('click', () => {
        const panel = $$('[role="tabpanel"]', root).find((p) => !p.hidden) || root;
        const triggers = $$('.acc-trigger', panel);
        const openAll = triggers.some((t) => t.getAttribute('aria-expanded') !== 'true');
        triggers.forEach((t) => setAccordionItem(t, openAll));
        button.textContent = openAll ? 'Ocultar detalles' : 'Ver detalles';
      });

      root.addEventListener('click', (event) => {
        if (event.target.closest('[role="tab"]')) button.textContent = 'Ver detalles';
      });
    });
  }

  /* ==========================================================================
     US-11 · TABLERO KANBAN SIMULADO
     - Las tarjetas se arrastran entre columnas (o se mueven con las flechas).
     - "En proceso" respeta un límite WIP: si ya tiene 2 tarjetas, no deja
       entrar otra y avisa (así se practica la regla de limitar el trabajo).
     - El estado vive en el arreglo "cards"; render() vuelve a dibujar todo.
     ========================================================================== */

  const KANBAN_COLUMNS = [
    { id: 'todo', name: 'Por hacer' },
    { id: 'doing', name: 'En proceso' },
    { id: 'done', name: 'Hecho' }
  ];
  const KANBAN_WIP_LIMIT = 2;
  const KANBAN_INITIAL = [
    { title: 'Diseñar US-10', col: 0 },
    { title: 'Pruebas unit. US-11', col: 0 },
    { title: 'Pruebas unit. US-03', col: 1 },
    { title: 'Maquetar US-04', col: 1 },
    { title: 'Pruebas unit. US-02', col: 2 },
    { title: 'Revisión QC/QA US-01', col: 2 }
  ];

  function initKanban() {
    const board = $('[data-kanban]');
    if (!board) return;

    const status = $('#kanban-status');
    const resetButton = $('#kanban-reset');
    let cards = [];

    /** Crea un botón de flecha (dir = -1 atrás, +1 adelante). Sirve para teclado y celular. */
    function makeButton(card, dir) {
      const target = KANBAN_COLUMNS[card.col + dir].name;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'kanban-btn';
      button.dataset.dir = String(dir);
      button.textContent = dir < 0 ? '←' : '→';
      button.setAttribute('aria-label', 'Mover «' + card.title + '» a ' + target);
      return button;
    }

    /** Dibuja las tres columnas según el estado actual. */
    function render() {
      KANBAN_COLUMNS.forEach((column, index) => {
        const element = $('[data-col="' + column.id + '"]', board);
        const list = $('.kanban-list', element);
        const inColumn = cards.filter((card) => card.col === index);

        $('.kanban-count', element).textContent = index === 1 ? inColumn.length + '/' + KANBAN_WIP_LIMIT : inColumn.length;
        list.innerHTML = '';

        if (!inColumn.length) {
          const empty = document.createElement('li');
          empty.className = 'kanban-empty';
          empty.textContent = 'Sin tarjetas';
          list.appendChild(empty);
        }

        inColumn.forEach((card) => {
          const item = document.createElement('li');
          item.className = 'kanban-card';
          item.dataset.cardId = String(card.id);

          const title = document.createElement('span');
          title.className = 'kanban-title';
          title.textContent = card.title;


          item.append(title);
          list.appendChild(item);
        });
      });
    }

    /** ¿"En proceso" está lleno para esta tarjeta? (no cuenta si ya está ahí) */
    function doingIsFull(card) {
      return card.col !== 1 && cards.filter((c) => c.col === 1).length >= KANBAN_WIP_LIMIT;
    }

    /**
     * Mueve una tarjeta a la columna "target" (0, 1 o 2). Sirve para flechas y
     * para arrastrar y soltar. Devuelve true si se movió.
     */
    function moveTo(id, target) {
      const card = cards.find((c) => c.id === id);
      if (!card || target === card.col) return false;

      // Regla WIP: no entra una tarjeta más si "En proceso" ya tiene el máximo
      if (target === 1 && doingIsFull(card)) {
        const column = $('[data-col="doing"]', board);
        column.classList.add('is-blocked');
        setTimeout(() => column.classList.remove('is-blocked'), 1400);
        status.textContent = 'Límite WIP alcanzado: termina una tarjeta de En proceso antes de empezar otra.';
        return false;
      }

      card.col = target;
      status.textContent = '«' + card.title + '» pasó a ' + KANBAN_COLUMNS[target].name + '.';
      render();
      return true;
    }

    /* ---- Flechas (teclado y celular) ---- */
    board.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dir]');
      if (!button) return;

      const id = Number(button.closest('.kanban-card').dataset.cardId);
      const dir = Number(button.dataset.dir);
      const card = cards.find((c) => c.id === id);

      if (moveTo(id, card.col + dir)) {
        // Devuelve el foco a la tarjeta movida para no perder el lugar con teclado
        const next = $('[data-card-id="' + id + '"] [data-dir="' + dir + '"]', board) || $('[data-card-id="' + id + '"] button', board);
        if (next) next.focus();
      }
    });

    /* ---- Arrastrar y soltar (mouse y táctil, con Pointer Events) ----
       1. pointerdown sobre una tarjeta: se guarda el punto de partida.
       2. pointermove: al superar el umbral, se crea una copia "fantasma" que
          sigue al puntero y se resalta la columna que está debajo.
       3. pointerup: si hay una columna debajo, se mueve ahí la tarjeta.
       Escape o pointercancel cancelan el arrastre. */
    const DRAG_THRESHOLD = 6; // píxeles antes de considerar que es un arrastre
    let drag = null;

    function columnAt(x, y) {
      const element = document.elementFromPoint(x, y); // el fantasma ignora el puntero (CSS)
      return element ? element.closest('[data-col]') : null;
    }

    /** Resalta la columna bajo el puntero (rosa) o la marca como llena (rojo). */
    function highlight(column) {
      const card = drag && cards.find((c) => c.id === drag.id);
      $$('.kanban-col', board).forEach((col) => {
        const isTarget = col === column;
        const denied = isTarget && col.dataset.col === 'doing' && card && doingIsFull(card);
        col.classList.toggle('is-over', isTarget && !denied);
        col.classList.toggle('is-denied', denied);
      });
    }

    function onMove(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;

      if (!drag.active) {
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) return;
        drag.active = true;
        drag.ghost = drag.item.cloneNode(true);
        drag.ghost.classList.add('kanban-ghost');
        drag.ghost.style.width = drag.width + 'px';
        document.body.appendChild(drag.ghost);
        drag.item.classList.add('is-dragging');
        document.body.classList.add('is-kanban-dragging');
      }

      drag.ghost.style.left = (event.clientX - drag.offsetX) + 'px';
      drag.ghost.style.top = (event.clientY - drag.offsetY) + 'px';
      highlight(columnAt(event.clientX, event.clientY));
    }

    function endDrag() {
      if (!drag) return;
      if (drag.ghost) drag.ghost.remove();
      drag.item.classList.remove('is-dragging');
      document.body.classList.remove('is-kanban-dragging');
      highlight(null);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', endDrag);
      document.removeEventListener('keydown', onKey);
      drag = null;
    }

    function onUp(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const id = drag.id;
      const column = drag.active ? columnAt(event.clientX, event.clientY) : null;
      endDrag(); // primero se limpia: moveTo() vuelve a dibujar el tablero
      if (column) moveTo(id, KANBAN_COLUMNS.findIndex((c) => c.id === column.dataset.col));
    }

    function onKey(event) {
      if (event.key === 'Escape') endDrag();
    }

    board.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target.closest('button')) return; // las flechas se manejan aparte
      const item = event.target.closest('.kanban-card');
      if (!item) return;

      const rect = item.getBoundingClientRect();
      drag = {
        id: Number(item.dataset.cardId),
        item,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        active: false,
        ghost: null
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', endDrag);
      document.addEventListener('keydown', onKey);
    });

    /* ---- Reinicio y estado inicial ---- */
    function loadInitial() {
      cards = KANBAN_INITIAL.map((card, index) => ({ id: index, title: card.title, col: card.col }));
      render();
    }

    resetButton.addEventListener('click', () => {
      loadInitial();
      status.textContent = 'Tablero reiniciado.';
    });

    loadInitial();
  }

  /* ==========================================================================
     ARRANQUE
     ========================================================================== */

  document.addEventListener('DOMContentLoaded', () => {
    initComingSoonLinks();
    initNavigation();
    initSearch();
    initTabs();
    initAccordions();
    initQualityFilters();
    initExpandAll();
    initKanban();
    initFlipCards();
    initToolFilter();
    initTimeline();
    initQuickNav();
  });
})();