/** java.js — Lógica de interacción · Portal SGCS · Crowd Loop · Sprint 1
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
 *   US-06        Navegación interna por subsecciones  → initQuickNav()*/
(function () {
  'use strict';

  /* UTILIDADES*/

  /** Atajos para seleccionar elementos. */
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  /**
   * Normaliza un texto para comparar: minúsculas y sin tildes.
   * Permite que "calidad" coincida con "Calidád" o "CALIDAD".*/
  function normalize(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  /*AVISO ("TOAST") Y ENLACES "PRÓXIMAMENTE"
     Los enlaces con el atributo data-coming-soon apuntan a páginas que aún no
     existen (Metodologías, Glosario, Aviso Legal…). Muestran un aviso en lugar
     de una página 404. Cuando la página exista, se quita el atributo. */

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

  /*  US-01 · MENÚ HAMBURGUESA DINÁMICO
     - Botón .nav-toggle abre/cierra el panel #site-nav (visible hasta 1024px).
     - Mantiene sincronizados aria-expanded y aria-label (accesibilidad).
     - Se cierra con: clic en un enlace, tecla Escape, clic fuera del menú
       o al agrandar la ventana hasta el modo escritorio. */

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

  /* 
     BUSCADOR DEL ENCABEZADO: Búsqueda simple sobre un índice estático de páginas y secciones.
     Al escribir muestra hasta 6 resultados; Enter abre el primero.*/

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
    { title: 'Comparador de metodologías', url: 'metodologias.html#tools-title', keywords: 'comparador comparar cascada modelo en v incremental scrum kanban xp tabla' },
    { title: 'Encuesta de preferencias metodológicas', url: 'metodologias.html#us19-title', keywords: 'encuesta cuestionario recomendacion metodologia proyecto porcentaje' },
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

  /* US-02 · PESTAÑAS (TABS)
     Patrón ARIA "tabs": role=tablist / tab / tabpanel.
     - Clic o teclado (← → Inicio Fin) para cambiar de pestaña.
     - Solo la pestaña activa está en el orden de tabulación (roving tabindex).
     - Admite enlaces directos: fundamentos.html#tab-iso25000*/

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

  /*US-02 · ACORDEÓN
     Cada .acc-trigger controla un panel (aria-controls). Con el atributo
     data-single en el contenedor, solo un ítem puede estar abierto a la vez.*/

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

  /* TARJETA RESUMEN DE GESTIÓN DE CALIDAD (US-03 + US-04, filtro en fundamentos.html)
     Cada botón "Filtrar" de la tarjeta resumen es un interruptor: al activarse
     (o desactivarse) se agrega o se quita su descripción del panel de
     resultados. Varios pueden estar activos a la vez.*/

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

  /*US-03 · TARJETAS INTERACTIVAS (FLIP-CARDS)
     - Clic en la tarjeta (o en sus botones, con teclado) la voltea.
     - La cara oculta se marca como "inert" para que no reciba foco ni la lea
       un lector de pantalla.
     - Botón "Voltear todas" para revisar el contenido completo.*/

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

  /*US-04 · FILTRO INTERACTIVO EN TIEMPO REAL
     Combina dos criterios: categoría (botones) y texto (buscador).
     Cada tarjeta declara su categoría con data-category="slug".
     Se actualiza el contador (aria-live) y un mensaje si no hay resultados.*/

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

  /*US-05 · LÍNEA DE TIEMPO SDLC
     - Cada fase se expande/contrae y se ilumina al activarse.
     - Al desplazar la página, una línea de progreso se "llena" y los
       marcadores por los que pasa se iluminan suavemente.
     - El scroll se procesa con requestAnimationFrame para no perder fluidez. */

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

  /* US-06 · NAVEGACIÓN INTERNA RÁPIDA POR SUBSECCIONES
     - Las anclas (#cascada, #modelo-v…) hacen scroll suave (ver CSS).
     - IntersectionObserver detecta la subsección visible y marca su enlace
       con aria-current, centrando el botón en la barra en móviles. */

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

  /* US-10 · BOTÓN "VER DETALLES" (Scrum)
     Abre (o cierra) todos los acordeones del panel de pestaña visible.
     Al cambiar de pestaña el botón vuelve a su texto inicial.*/

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

  /* US-11 · TABLERO KANBAN SIMULADO
     - Las tarjetas se arrastran entre columnas.
     - "En proceso" respeta un límite WIP: si ya tiene 2 tarjetas, no deja
       entrar otra y avisa (así se practica la regla de limitar el trabajo).
     - El estado vive en el arreglo "cards"; render() vuelve a dibujar todo. */

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
     * Mueve una tarjeta a la columna "target" (0, 1 o 2) al soltarla.
     * Devuelve true si se movió.
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
  /*US-18 · COMPARADOR INTERACTIVO DE METODOLOGÍAS
     - Se eligen metodologías con casillas (mínimo 2). La validación es en
       tiempo real: con menos de 2 se muestra el error y "Comparar" se bloquea.
     - Al comparar se arma la tabla con una columna por metodología elegida.
     - Resaltado: tocar el nombre de una característica o de una metodología
       marca su fila o columna (se puede combinar y se quita tocando de nuevo). */
  const COMPARE_ROWS = [
    'Enfoque principal',
    'Flexibilidad al cambio',
    'Estructura de roles',
    'Frecuencia de entregas',
    'Nivel de documentación',
    'Gestión de riesgo'
  ];

  // Mismo orden que COMPARE_ROWS
  const COMPARE_METHODS = {
    'cascada': { name: 'Cascada', values: ['Secuencial rígido', 'Baja / Inflexible', 'Especializados por fase', 'Única entrega al final', 'Extensa y exhaustiva', 'Alto al final del proyecto'] },
    'modelo-v': { name: 'Modelo en V', values: ['Secuencial orientado a QA', 'Baja / Riguroso', 'Devs y Testers pares', 'Entrega única formal', 'Muy estricta y trazable', 'Medio-Bajo en verificación'] },
    'incremental': { name: 'Incremental', values: ['Entregas parciales por módulos', 'Media', 'Equipos por incremento', 'Varias entregas incrementales', 'Media', 'Medio: se detecta en cada incremento'] },
    'scrum': { name: 'Scrum', values: ['Iterativo en Sprints', 'Alta', 'Product Owner, Scrum Master y Developers', 'Cada Sprint (1 a 4 semanas)', 'Ligera y justa', 'Bajo: se revisa en cada Sprint'] },
    'kanban': { name: 'Kanban', values: ['Flujo continuo', 'Muy alta', 'Sin roles obligatorios', 'Continua, tarea por tarea', 'Mínima', 'Bajo: el límite WIP muestra los cuellos de botella'] },
    'xp': { name: 'XP', values: ['Iterativo centrado en prácticas técnicas', 'Muy alta', 'Programadores, cliente en el equipo y coach', 'Muy frecuentes (iteraciones de 1 a 2 semanas)', 'Mínima: el código y las pruebas documentan', 'Bajo: pruebas e integración continuas'] }
  };

  function initComparator() {
    const form = $('#compare-form');
    const table = $('#compare-table');
    if (!form || !table) return;

    const boxes = $$('input[name="method"]', form);
    const error = $('#compare-error');
    const submit = $('button[type="submit"]', form);
    const status = $('#compare-status');
    let highlightedRow = null;
    let highlightedCol = null;

    /** Claves de las metodologías marcadas, en el orden de las casillas. */
    function selectedKeys() {
      return boxes.filter((box) => box.checked).map((box) => box.value);
    }

    /** Validación en tiempo real: mínimo 2 metodologías. */
    function validate() {
      const valid = selectedKeys().length >= 2;
      error.hidden = valid;
      submit.disabled = !valid;
      boxes.forEach((box) => box.closest('.check-item').classList.toggle('is-checked', box.checked));
    }

    /** Aplica el resaltado a la fila y/o columna elegidas. */
    function applyHighlight() {
      $$('[data-row], [data-col]', table).forEach((cell) => {
        const hit = (highlightedRow !== null && cell.dataset.row === String(highlightedRow)) ||
                    (highlightedCol !== null && cell.dataset.col === highlightedCol);
        cell.classList.toggle('is-hl', hit);
      });
      $$('[data-hl-row]', table).forEach((button) => button.setAttribute('aria-pressed', String(String(highlightedRow) === button.dataset.hlRow)));
      $$('[data-hl-col]', table).forEach((button) => button.setAttribute('aria-pressed', String(highlightedCol === button.dataset.hlCol)));
    }

    /** Arma la tabla para las metodologías indicadas. */
    function render(keys) {
      highlightedRow = null;
      highlightedCol = null;
      table.style.minWidth = (130 + 105 * keys.length) + 'px';

      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      const corner = document.createElement('th');
      corner.scope = 'col';
      corner.textContent = 'Característica';
      headRow.appendChild(corner);

      keys.forEach((key) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.dataset.col = key;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hl-btn';
        button.dataset.hlCol = key;
        button.setAttribute('aria-pressed', 'false');
        button.textContent = COMPARE_METHODS[key].name;
        th.appendChild(button);
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);

      const tbody = document.createElement('tbody');
      COMPARE_ROWS.forEach((label, rowIndex) => {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row';
        th.dataset.row = String(rowIndex);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hl-btn';
        button.dataset.hlRow = String(rowIndex);
        button.setAttribute('aria-pressed', 'false');
        button.textContent = label;
        th.appendChild(button);
        tr.appendChild(th);

        keys.forEach((key) => {
          const td = document.createElement('td');
          td.dataset.row = String(rowIndex);
          td.dataset.col = key;
          td.textContent = COMPARE_METHODS[key].values[rowIndex];
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      // Se conserva el <caption> y se reemplaza el resto
      $$('thead, tbody', table).forEach((part) => part.remove());
      table.append(thead, tbody);
      status.textContent = 'Comparando: ' + keys.map((key) => COMPARE_METHODS[key].name).join(', ') + '.';
    }

    boxes.forEach((box) => box.addEventListener('change', validate));

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      validate();
      if (selectedKeys().length >= 2) render(selectedKeys());
    });

    // Resaltado de fila / columna (delegación de eventos sobre la tabla)
    table.addEventListener('click', (event) => {
      const rowButton = event.target.closest('[data-hl-row]');
      const colButton = event.target.closest('[data-hl-col]');
      if (rowButton) highlightedRow = highlightedRow === Number(rowButton.dataset.hlRow) ? null : Number(rowButton.dataset.hlRow);
      if (colButton) highlightedCol = highlightedCol === colButton.dataset.hlCol ? null : colButton.dataset.hlCol;
      if (rowButton || colButton) applyHighlight();
    });

    validate();
    render(selectedKeys());
  }
  /*US-19 · ENCUESTA DE PREFERENCIAS METODOLÓGICAS
     - 4 preguntas + un paso final (5 pasos). La barra de progreso avanza 20%
       por paso al tocar "Siguiente".
     - Validación en tiempo real: "Siguiente" queda bloqueado hasta elegir una
       opción, y un mensaje lo explica.
     - Cada opción suma puntos a Cascada, Scrum y Kanban. Al final, los puntos
       se convierten en porcentajes (suman 100) y se sugiere el más alto.
     - El resumen solo muestra el resultado en el paso 5; antes, un indicador
       de carga con el progreso de preguntas evaluadas. */
  const SURVEY_METHODS = [
    { id: 'cascada', name: 'Cascada' },
    { id: 'scrum', name: 'Scrum' },
    { id: 'kanban', name: 'Kanban' }
  ];

  const SURVEY_STEPS = [
    {
      title: 'Complejidad del Proyecto',
      question: '¿Cuál es el nivel de complejidad técnica y tamaño del proyecto?',
      options: [
        { text: 'Proyecto pequeño con alcance muy simple y definido', score: { cascada: 3, scrum: 1, kanban: 2 } },
        { text: 'Proyecto de tamaño mediano con interacciones dinámicas', score: { cascada: 1, scrum: 3, kanban: 2 } },
        { text: 'Proyecto grande, altamente complejo y de arquitectura distribuida', score: { cascada: 2, scrum: 3, kanban: 1 } }
      ]
    },
    {
      title: 'Requisitos Cambiantes',
      question: '¿Cómo se caracterizan los requisitos de su proyecto?',
      options: [
        { text: 'Fijos, totalmente predefinidos y aprobados previamente', score: { cascada: 3, scrum: 1, kanban: 1 } },
        { text: 'Variables, cambiantes según retroalimentación del mercado', score: { cascada: 0, scrum: 3, kanban: 2 } },
        { text: 'Flujo continuo de tareas e incidencias sin iteraciones fijas', score: { cascada: 0, scrum: 1, kanban: 3 } }
      ]
    },
    {
      title: 'Restricción de Tiempo',
      question: '¿Cuál es el esquema de tiempo deseado para las entregas?',
      options: [
        { text: 'Entrega única al final del ciclo de desarrollo', score: { cascada: 3, scrum: 0, kanban: 1 } },
        { text: 'Entregas periódicas en iteraciones cortas (1 a 4 semanas)', score: { cascada: 0, scrum: 3, kanban: 1 } },
        { text: 'Despliegue continuo a medida que cada tarea se complete', score: { cascada: 0, scrum: 1, kanban: 3 } }
      ]
    },
    {
      title: 'Equipo y Cliente',
      question: '¿Cuál es el nivel de involucramiento disponible del cliente?',
      options: [
        { text: 'Bajo: Solo al inicio para requisitos y al final para aceptación', score: { cascada: 3, scrum: 1, kanban: 1 } },
        { text: 'Alto: Disponible para revisiones al final de cada iteración', score: { cascada: 1, scrum: 3, kanban: 1 } },
        { text: 'Continuo: Monitoreo constante del tablero de trabajo', score: { cascada: 0, scrum: 1, kanban: 3 } }
      ]
    }
  ];

  const SURVEY_FINAL_STEP = SURVEY_STEPS.length; // índice del paso 5 (resultado)

  /**
   * Convierte las respuestas en porcentajes y elige la metodología sugerida.
   * Los porcentajes se reparten por "mayor resto" para que sumen exactamente 100.
   * En un empate se prioriza a quien puntúa más en la pregunta de requisitos y,
   * si sigue empatado, el orden Scrum, Kanban, Cascada.
   */
  function computeSurveyResult(answers) {
    const totals = { cascada: 0, scrum: 0, kanban: 0 };
    answers.forEach((choice, stepIndex) => {
      const score = SURVEY_STEPS[stepIndex].options[choice].score;
      SURVEY_METHODS.forEach((method) => { totals[method.id] += score[method.id]; });
    });

    const sum = SURVEY_METHODS.reduce((acc, method) => acc + totals[method.id], 0);
    const percents = {};
    const remainders = [];
    let assigned = 0;
    SURVEY_METHODS.forEach((method) => {
      const exact = (totals[method.id] / sum) * 100;
      percents[method.id] = Math.floor(exact);
      assigned += percents[method.id];
      remainders.push({ id: method.id, rest: exact - Math.floor(exact) });
    });
    remainders.sort((a, b) => b.rest - a.rest);
    for (let i = 0; i < 100 - assigned; i += 1) percents[remainders[i].id] += 1;

    const top = Math.max(...SURVEY_METHODS.map((method) => totals[method.id]));
    let leaders = SURVEY_METHODS.map((method) => method.id).filter((id) => totals[id] === top);
    const tied = leaders.length > 1 ? leaders.slice() : [];

    if (leaders.length > 1) {
      const requirements = SURVEY_STEPS[1].options[answers[1]].score;
      const best = Math.max(...leaders.map((id) => requirements[id]));
      leaders = leaders.filter((id) => requirements[id] === best);
    }
    if (leaders.length > 1) {
      leaders = ['scrum', 'kanban', 'cascada'].filter((id) => leaders.includes(id));
    }

    return { percents, winner: leaders[0], tied };
  }

  function initSurvey() {
    const fieldset = $('#survey-question-wrap');
    if (!fieldset) return;

    const pill = $('#survey-pill');
    const stepTitle = $('#survey-step-title');
    const percentLabel = $('#survey-percent');
    const bar = $('#survey-bar');
    const fill = $('#survey-fill');
    const legend = $('#survey-question');
    const optionsBox = $('#survey-options');
    const finalBox = $('#survey-final');
    const finalTitle = $('#survey-final-title');
    const hint = $('#survey-hint');
    const prev = $('#survey-prev');
    const next = $('#survey-next');
    const restart = $('#survey-restart');
    const meta = $('#survey-meta');
    const loading = $('#survey-loading');
    const progressText = $('#survey-progress-text');
    const result = $('#survey-result');
    const winnerLabel = $('#survey-winner');
    const percentsBox = $('#survey-percents');
    const tieNote = $('#survey-tie');

    let step = 0;
    let answers = SURVEY_STEPS.map(() => null);

    /** Dibuja la pregunta del paso actual, con la respuesta previa si existe. */
    function renderQuestion() {
      const data = SURVEY_STEPS[step];
      legend.textContent = data.question;
      optionsBox.innerHTML = '';

      data.options.forEach((option, index) => {
        const label = document.createElement('label');
        label.className = 'option' + (answers[step] === index ? ' is-selected' : '');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'survey-answer';
        input.value = String(index);
        input.checked = answers[step] === index;

        const text = document.createElement('span');
        text.textContent = option.text;

        label.append(input, text);
        optionsBox.appendChild(label);
      });
    }

    /** Resumen: cargando durante la encuesta, resultado solo en el paso final. */
    function renderSummary() {
      const isFinal = step === SURVEY_FINAL_STEP;
      loading.hidden = isFinal;
      result.hidden = !isFinal;

      if (!isFinal) {
        const answered = answers.filter((answer) => answer !== null).length;
        meta.textContent = 'Paso ' + (step + 1) + ' de 5 registrado';
        progressText.textContent = 'Progreso actual: ' + answered + ' de ' + SURVEY_STEPS.length + ' preguntas evaluadas.';
        return;
      }

      const outcome = computeSurveyResult(answers);
      const winnerName = SURVEY_METHODS.find((method) => method.id === outcome.winner).name;
      meta.textContent = 'Evaluación finalizada';
      winnerLabel.textContent = winnerName + ' (' + outcome.percents[outcome.winner] + '% de coincidencia)';

      percentsBox.innerHTML = '';
      SURVEY_METHODS.forEach((method) => {
        const box = document.createElement('div');
        box.className = 'percent-box' + (method.id === outcome.winner ? ' is-top' : '');
        const strong = document.createElement('strong');
        strong.textContent = outcome.percents[method.id] + '%';
        box.append(method.name, strong);
        percentsBox.appendChild(box);
      });

      if (outcome.tied.length) {
        const names = outcome.tied.map((id) => SURVEY_METHODS.find((method) => method.id === id).name);
        tieNote.textContent = 'Resultado ajustado: hay empate entre ' + names.join(' y ') + '. Conviene evaluar ambas opciones.';
        tieNote.hidden = false;
      } else {
        tieNote.hidden = true;
      }
    }

    /** Actualiza botones, mensaje de validación y barra de progreso. */
    function renderControls() {
      const isFinal = step === SURVEY_FINAL_STEP;
      const percent = (step + 1) * 20;

      pill.textContent = 'Paso ' + (step + 1) + '/5';
      stepTitle.textContent = 'Paso ' + (step + 1) + ': ' + (isFinal ? 'Sugerencia Final' : SURVEY_STEPS[step].title);
      percentLabel.textContent = percent + '%';
      fill.style.width = percent + '%';
      bar.setAttribute('aria-valuenow', String(percent));

      fieldset.hidden = isFinal;
      finalBox.hidden = !isFinal;
      prev.disabled = step === 0;
      next.hidden = isFinal;
      restart.hidden = !isFinal;

      const missing = !isFinal && answers[step] === null;
      next.disabled = missing;
      hint.hidden = !missing;
    }

    function render() {
      if (step !== SURVEY_FINAL_STEP) renderQuestion();
      renderControls();
      renderSummary();
    }

    /** Lleva el foco al contenido nuevo para quien navega con teclado o lector. */
    function focusContent() {
      const target = step === SURVEY_FINAL_STEP ? finalTitle : ($('input:checked', optionsBox) || $('input', optionsBox));
      if (target) target.focus({ preventScroll: true });
    }

    // Elegir una opción habilita "Siguiente" al instante (validación en tiempo real)
    optionsBox.addEventListener('change', (event) => {
      if (event.target.name !== 'survey-answer') return;
      answers[step] = Number(event.target.value);
      $$('.option', optionsBox).forEach((label) => label.classList.toggle('is-selected', $('input', label).checked));
      renderControls();
      renderSummary();
    });

    next.addEventListener('click', () => {
      if (answers[step] === null) return;
      step += 1;
      render();
      focusContent();
    });

    prev.addEventListener('click', () => {
      if (step === 0) return;
      step -= 1;
      render();
      focusContent();
    });

    restart.addEventListener('click', () => {
      answers = SURVEY_STEPS.map(() => null);
      step = 0;
      render();
      focusContent();
    });

    render();
  }

  /* ARRANQUE*/

  document.addEventListener('DOMContentLoaded', () => {
    initComingSoonLinks();
    initNavigation();
    initSearch();
    initTabs();
    initAccordions();
    initQualityFilters();
    initExpandAll();
    initKanban();
    initComparator();
    initSurvey();
    initFlipCards();
    initToolFilter();
    initTimeline();
    initQuickNav();
  });
})();