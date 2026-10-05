/* AdminYAAA — comportamiento de la página. Sin dependencias.
   Si el JavaScript falla, la página sigue siendo completamente usable:
   los enlaces de WhatsApp, correo y mapa funcionan igual y no hay
   contenido que dependa de este archivo para verse. */
(function () {
  'use strict';

  /* ---------- Menú (celular y tablet) ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* ---------- Barra fija de WhatsApp ----------
     Se oculta cuando ya se ven los botones principales (portada o contacto)
     para no duplicar ni tapar contenido. */
  var bar = document.getElementById('wa-bar');
  if (bar && 'IntersectionObserver' in window) {
    var visible = new Set();
    var barObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target);
      });
      bar.classList.toggle('is-hidden', visible.size > 0);
    }, { threshold: 0.25 });
    ['hero-cta', 'contacto'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) barObserver.observe(el);
    });
  }

  /* ---------- Calculadora de tiempo perdido ---------- */
  var calcFields = ['calc-factura', 'calc-stock', 'calc-numeros'].map(function (id) { return document.getElementById(id); });
  var calcTramites = document.getElementById('calc-tramites');
  var calcHoras = document.getElementById('calc-horas');
  var calcDias = document.getElementById('calc-dias');
  if (calcFields.every(Boolean) && calcTramites && calcHoras && calcDias) {
    var SEMANAS_POR_MES = 4.33;
    var PORCENTAJE_RECUPERADO = 0.9;
    function recalcular() {
      var semanales = calcFields.reduce(function (sum, el) { return sum + (parseFloat(el.value) || 0); }, 0);
      var mensuales = semanales * SEMANAS_POR_MES + (parseFloat(calcTramites.value) || 0);
      var recuperadas = Math.round(mensuales * PORCENTAJE_RECUPERADO);
      calcHoras.textContent = String(recuperadas);
      calcDias.textContent = String(Math.max(1, Math.round(recuperadas / 8)));
    }
    calcFields.concat([calcTramites]).forEach(function (el) { el.addEventListener('input', recalcular); });
    recalcular();
  }
})();
