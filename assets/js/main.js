/* AdminYAAA — comportamiento de la página. Sin dependencias.
   Si el JavaScript falla, la página sigue siendo completamente usable:
   los enlaces de WhatsApp y correo funcionan igual. */
(function () {
  'use strict';

  var WA1 = '5491125604901';
  var WA2 = '5491130332341';
  var MAIL = 'adminyaaa@gmail.com';

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

  /* ---------- Formulario: arma el mensaje, no envía nada por su cuenta ---------- */
  var form = document.getElementById('form-caso');
  if (form) {
    var fNombre = form.elements.nombre;
    var fRubro = form.elements.rubro;
    var fTema = form.elements.tema;
    var fMensaje = form.elements.mensaje;
    var aWa1 = document.getElementById('send-wa1');
    var aWa2 = document.getElementById('send-wa2');
    var aMail = document.getElementById('send-mail');

    function buildMessage() {
      var nombre = fNombre.value.trim();
      var lines = ['Hola AdminYAAA' + (nombre ? ', soy ' + nombre : '') + '.'];
      if (fRubro.value) lines.push('Mi negocio es: ' + fRubro.value + '.');
      if (fTema.value) lines.push('Quiero resolver: ' + fTema.value + '.');
      var extra = fMensaje.value.trim();
      if (extra) lines.push(extra);
      if (lines.length === 1) lines.push('Quiero consultar por la administración de mi negocio.');
      lines.push('(Mensaje armado desde la web de AdminYAAA)');
      return lines.join('\n');
    }
    function refresh() {
      var text = buildMessage();
      var q = encodeURIComponent(text);
      aWa1.href = 'https://wa.me/' + WA1 + '?text=' + q;
      aWa2.href = 'https://wa.me/' + WA2 + '?text=' + q;
      aMail.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Consulta desde la web') + '&body=' + q;
    }
    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    form.addEventListener('submit', function (e) { e.preventDefault(); }); // Enter no recarga la página
    refresh();
  }

  /* ---------- Aparición suave al hacer scroll ---------- */
  var items = document.querySelectorAll('.reveal');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (items.length && 'IntersectionObserver' in window && !calm) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    // Lo que ya está a la vista (o por encima, si el navegador restauró el scroll) no se anima.
    items.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
      else revealObserver.observe(el);
    });
    document.documentElement.classList.add('reveal-on');
    // Red de seguridad: si por algún motivo el observador no responde, se muestra todo.
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.5) el.classList.add('in');
      });
    }, 2500);
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }
})();
