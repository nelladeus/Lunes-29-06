/* ================================================================
   APEX — SIM-RACING ACADEMY
   Script principal. JavaScript nativo (sin frameworks).
   Organizado en bloques independientes, cada uno con su propia
   responsabilidad, para que sea fácil de leer y modificar.
================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------------
     0. ICONOS (Lucide)
     La librería se carga con "defer" desde el HTML, así que para
     asegurarnos de que ya existe en window, la inicializamos acá.
  ---------------------------------------------------------------- */
  if (window.lucide) {
    lucide.createIcons();
  }


  /* ----------------------------------------------------------------
     1. MENÚ MOBILE (hamburguesa)
     Alterna la clase "is-open" del panel y actualiza aria-expanded
     para que los lectores de pantalla sepan el estado del botón.
  ---------------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    // Cierra el menú automáticamente al tocar un link (mejor UX en mobile)
    navMobile.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }


  /* ----------------------------------------------------------------
     2. ANIMACIONES DE ENTRADA AL HACER SCROLL
     Cualquier elemento con la clase ".reveal" se anima cuando entra
     en el viewport. Usamos IntersectionObserver porque es mucho más
     performante que escuchar el evento "scroll" directamente.
  ---------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target); // se anima una sola vez
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach((el) => revealObserver.observe(el));


  /* ----------------------------------------------------------------
     3. PLACEHOLDERS DE IMAGEN
     Cada ".img-frame" contiene un <img>. Si la imagen real todavía
     no existe (porque el usuario no la subió), mostramos el patrón
     de blueprint + la etiqueta con el nombre de archivo sugerido.
     Cuando el usuario reemplace el "src" por una imagen real, esta
     misma lógica hace que se vea correctamente sin tocar el CSS.
  ---------------------------------------------------------------- */
  // Rellena (o crea, si no existe en el HTML) el span con el texto del
  // archivo sugerido, leyendo el atributo data-label del contenedor.
  document.querySelectorAll('.img-frame[data-label]').forEach((frame) => {
    let label = frame.querySelector('.img-frame__label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'img-frame__label';
      frame.appendChild(label);
    }
    label.textContent = frame.dataset.label;
  });

  document.querySelectorAll('.img-frame img').forEach((img) => {
    const frame = img.closest('.img-frame');

    img.addEventListener('load', () => {
      // Si la imagen cargó y no es un "0x0" típico de src vacío/roto
      if (img.naturalWidth > 0) {
        frame.classList.add('is-loaded');
      }
    });

    img.addEventListener('error', () => {
      frame.classList.remove('is-loaded'); // se queda mostrando el placeholder
    });
  });


  /* ----------------------------------------------------------------
     4. TICKER DE TELEMETRÍA DEL HERO
     Simula datos "en vivo" (acelerador, freno, RPM, marcha) que
     fluctúan de forma aleatoria pero realista, solo mientras el
     hero está visible en pantalla (ahorra recursos en background).
  ---------------------------------------------------------------- */
  const heroTicker = document.getElementById('heroTicker');

  if (heroTicker) {
    const throttleEl = heroTicker.querySelector('[data-ticker="throttle"]');
    const brakeEl = heroTicker.querySelector('[data-ticker="brake"]');
    const rpmEl = heroTicker.querySelector('[data-ticker="rpm"]');
    const gearEl = heroTicker.querySelector('[data-ticker="gear"]');
    const gears = ['N', '1', '2', '3', '4', '5', '6'];

    let tickerInterval = null;

    function tickHeroTelemetry() {
      const throttle = Math.floor(Math.random() * 100);
      // El freno y el acelerador casi nunca están altos al mismo tiempo (más realista)
      const brake = throttle > 60 ? Math.floor(Math.random() * 15) : Math.floor(Math.random() * 100);
      const rpm = 2000 + Math.floor(Math.random() * 7400);
      const gear = gears[Math.floor(Math.random() * gears.length)];

      throttleEl.textContent = `${throttle}%`;
      brakeEl.textContent = `${brake}%`;
      rpmEl.textContent = rpm.toLocaleString('es-AR');
      gearEl.textContent = gear;
    }

    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !tickerInterval) {
          tickHeroTelemetry();
          tickerInterval = setInterval(tickHeroTelemetry, 900);
        } else if (!entry.isIntersecting && tickerInterval) {
          clearInterval(tickerInterval);
          tickerInterval = null;
        }
      });
    }, { threshold: 0.2 });

    heroObserver.observe(heroTicker);
  }


  /* ----------------------------------------------------------------
     5. DASHBOARD DE TELEMETRÍA (Sección 3 — elemento principal)
     - Dibuja cada gráfico (stroke-dasharray/offset) cuando el panel
       entra en pantalla, simulando un trazado en tiempo real.
     - Activa la línea de "playhead" que recorre el panel.
     - Actualiza los valores numéricos de cada canal en vivo.
  ---------------------------------------------------------------- */
  const dashboard = document.getElementById('telemetryDashboard');

  if (dashboard) {
    const paths = dashboard.querySelectorAll('.chart-path');
    let readoutInterval = null;
    let compareRevealed = false;
    const compareFinalEls = dashboard.querySelectorAll('.chart-compare__final');

    compareFinalEls.forEach((el) => {
      el.addEventListener('transitionend', (ev) => {
        // detectamos el fin de la transición de clip-path
        if (ev.propertyName && ev.propertyName.indexOf('clip-path') !== -1) {
          compareRevealed = true;
        }
      });
    });

    // Prepara cada path para la animación de "dibujado" calculando su largo real
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
    });

    function drawCharts() {
      paths.forEach((path, i) => {
        // pequeño delay escalonado entre canales para un efecto más orgánico
        setTimeout(() => {
          path.style.transition = 'stroke-dashoffset 1.4s ease-out';
          path.style.strokeDashoffset = '0';
        }, i * 200);
      });
    }

    function tickReadouts() {
      // Mientras no se revele la traza final, mostramos datos "novato"
      let brakeVal, throttleVal, steeringVal;
      if (!compareRevealed) {
        // Novato: valores más erráticos / menos óptimos
        brakeVal = Math.floor(40 + Math.random() * 60);
        throttleVal = Math.floor(30 + Math.random() * 60);
        steeringVal = Math.floor(Math.random() * 180) - 90;
      } else {
        // Final: mejores (más controlados)
        brakeVal = Math.floor(Math.random() * 45); // menos freno sostenido
        throttleVal = Math.floor(60 + Math.random() * 40); // más acelerador útil
        steeringVal = Math.floor(Math.random() * 60) - 30; // ángulos más contenidos
      }

      const brakeOut = dashboard.querySelector('[data-readout="brake"]');
      const throttleOut = dashboard.querySelector('[data-readout="throttle"]');
      const steeringOut = dashboard.querySelector('[data-readout="steering"]');

      if (brakeOut) brakeOut.textContent = `${brakeVal}%`;
      if (throttleOut) throttleOut.textContent = `${throttleVal}%`;
      if (steeringOut) steeringOut.textContent = `${steeringVal}°`;
    }

    const dashboardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          drawCharts();
          dashboard.classList.add('is-active'); // activa el playhead vía CSS
          if (!readoutInterval) {
            tickReadouts();
            readoutInterval = setInterval(tickReadouts, 1100);
          }
          // iniciar animación sincronizada playhead -> revelar trazas finales
          startPlayheadReveal(4500);
        } else if (!entry.isIntersecting && readoutInterval) {
          clearInterval(readoutInterval);
          readoutInterval = null;
        }
      });
    }, { threshold: 0.3 });

    dashboardObserver.observe(dashboard);
    
    // Playhead reveal: hace dos pasadas
    // 1) Primera pasada: mueve solo el playhead para que el usuario vea los gráficos 'novato'
    // 2) Segunda pasada: mueve el playhead otra vez; durante esta pasada se revela la traza final
    //    (clip-path de .chart-compare__final disminuye) y se borra la traza novato (clip-path izquierdo aumenta)
    let playheadRunning = false;
    function startPlayheadReveal(duration = 4500, gapBetween = 800) {
      if (playheadRunning) return;
      playheadRunning = true;

      const playhead = dashboard.querySelector('.dashboard__playhead');
      const finalOverlays = Array.from(dashboard.querySelectorAll('.chart-compare__final'));
      const noviceOverlays = Array.from(dashboard.querySelectorAll('.chart-compare__novice'));
      if (!playhead) { playheadRunning = false; return; }

      const containerRect = dashboard.getBoundingClientRect();

      function animatePass(revealFinal, eraseNovice, passDuration, onComplete) {
        const start = performance.now();

        function step(now) {
          const t = Math.min((now - start) / passDuration, 1);

          // pos dentro del dashboard en px
          const x = containerRect.left + t * containerRect.width;
          const leftPx = x - dashboard.offsetLeft; // relativo al dashboard
          // colocar playhead centrado respecto al punto
          playhead.style.position = 'absolute';
          playhead.style.left = `${(t * 100).toFixed(4)}%`;

          if (revealFinal) {
            // revelar final desde la derecha hacia la izquierda: clip-path right% = 100 - pct
            const rightPct = Math.max(0, 100 - t * 100);
            finalOverlays.forEach((ov) => {
              ov.style.clipPath = `inset(0 ${rightPct}% 0 0)`;
              ov.style.webkitClipPath = `inset(0 ${rightPct}% 0 0)`;
            });
          }

          if (eraseNovice) {
            // ocultar novato desde la izquierda: leftInset = t*100%
            const leftPct = Math.min(100, t * 100);
            noviceOverlays.forEach((ov) => {
              ov.style.clipPath = `inset(0 0 0 ${leftPct}%)`;
              ov.style.webkitClipPath = `inset(0 0 0 ${leftPct}%)`;
            });
          }

          if (t < 1) requestAnimationFrame(step);
          else onComplete && onComplete();
        }

        requestAnimationFrame(step);
      }

      // Primera pasada: solo playhead
      animatePass(false, false, duration, () => {
        // esperar un pequeño gap y lanzar la segunda pasada
        setTimeout(() => {
          // reset clip-paths to starting positions for second pass
          finalOverlays.forEach((ov) => {
            ov.style.clipPath = 'inset(0 100% 0 0)';
            ov.style.webkitClipPath = 'inset(0 100% 0 0)';
          });
          noviceOverlays.forEach((ov) => {
            ov.style.clipPath = 'inset(0 0 0 0)';
            ov.style.webkitClipPath = 'inset(0 0 0 0)';
          });

          // Segunda pasada: revelar final y borrar novato
          animatePass(true, true, duration, () => {
            compareRevealed = true;
            playheadRunning = false;
          });
        }, gapBetween);
      });
    }
  }


  /* ----------------------------------------------------------------
     6. CONTADOR DE MEJORA DE TIEMPOS (Sección 7 — Resultados)
     Cada tarjeta tiene "data-count" con el valor final (ej: -1.2).
     Al entrar en pantalla, el número sube desde 0 hasta ese valor.
  ---------------------------------------------------------------- */
  const resultDeltas = document.querySelectorAll('.result-card__delta');

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const finalValue = parseFloat(el.dataset.count);
      const duration = 1200; // ms
      const startTime = performance.now();

      function animateCount(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        // easeOutCubic: arranca rápido y desacelera, se siente más "premium"
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = finalValue * eased;
        el.textContent = `${current.toFixed(1)}s`;

        if (progress < 1) {
          requestAnimationFrame(animateCount);
        } else {
          el.textContent = `${finalValue.toFixed(1)}s`;
        }
      }

      requestAnimationFrame(animateCount);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.4 });

  resultDeltas.forEach((el) => countObserver.observe(el));


  /* ----------------------------------------------------------------
     7. CARRUSEL DE CASOS DE ÉXITO
     Controles "anterior / siguiente" que desplazan el track una
     tarjeta a la vez. El scroll nativo + scroll-snap (CSS) hace
     que también funcione perfecto con swipe en mobile sin JS extra.
  ---------------------------------------------------------------- */
  const carouselTrack = document.getElementById('carouselTrack');
  const carouselPrev = document.getElementById('carouselPrev');
  const carouselNext = document.getElementById('carouselNext');

  if (carouselTrack && carouselPrev && carouselNext) {
    function scrollByCard(direction) {
      const card = carouselTrack.querySelector('.result-card');
      if (!card) return;
      const cardWidth = card.getBoundingClientRect().width + 16; // + gap aproximado
      carouselTrack.scrollBy({ left: cardWidth * direction, behavior: 'smooth' });
    }

    carouselPrev.addEventListener('click', () => scrollByCard(-1));
    carouselNext.addEventListener('click', () => scrollByCard(1));
  }


  /* ----------------------------------------------------------------
     8. FORMULARIO DE APLICACIÓN (Sección 8)
     No hay backend conectado: este bloque solo simula el envío,
     muestra el mensaje de confirmación y resetea el formulario.
     Para conectarlo a un backend real, reemplazar el TODO de abajo
     por un fetch() a tu endpoint / servicio de formularios.
  ---------------------------------------------------------------- */
  const applyForm = document.getElementById('applyForm');
  const applySuccess = document.getElementById('applySuccess');

  if (applyForm && applySuccess) {
    applyForm.addEventListener('submit', (event) => {
      event.preventDefault();

      // Validación nativa del navegador (campos "required")
      if (!applyForm.checkValidity()) {
        applyForm.reportValidity();
        return;
      }

      // TODO: reemplazar por el envío real, por ejemplo:
      // fetch('https://tu-endpoint.com/aplicaciones', {
      //   method: 'POST',
      //   body: new FormData(applyForm)
      // });

      applySuccess.hidden = false;
      applyForm.reset();
      applySuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }


  /* ----------------------------------------------------------------
       9. CONSOLA INTERACTIVA DE HARDWARE (Sección Ingeniería)
       Intercambia dinámicamente los datos y planos de simulación.
    ---------------------------------------------------------------- */
  const hardwareData = {
    volante: {
      title: "Volante Direct Drive",
      spec: "20 Nm <span class='hw-console__spec-unit'>TORQUE MÁXIMO</span>",
      desc: "Sentís cada pérdida de agarre y subviraje milisegundos antes de que pase en el simulador, permitiéndote corregir trayectorias de forma predictiva, no reactiva.",
      vs: "Volantes comerciales de engranajes plásticos que filtran, suavizan y 'redondean' los matices clave del asfalto, convirtiendo la simulación en un videojuego arcade.",
      img: "assets/img/volante.mp4"
    },
    pedalera: {
      title: "Pedalera Celda de Carga",
      spec: "200 kg <span class='hw-console__spec-unit'>RANGO DE PRESIÓN</span>",
      desc: "La frenada óptima no depende de la distancia del recorrido, sino de la memoria muscular de la fuerza aplicada. Automatiza el 'trail braking' perfecto gracias a su sensor de grado militar.",
      vs: "Pedaleras de potenciómetro o resorte blando que no distinguen fielmente la diferencia entre el 60% y el 90% de la presión de freno, bloqueando neumáticos constantemente.",
      img: "assets/img/pedales.mp4"
    },
    chasis: {
      title: "Chasis Aluminio Extruido",
      spec: "0 mm <span class='hw-console__spec-unit'>FLEX ESTRUCTURAL</span>",
      desc: "Estructura masiva de perfiles industriales que elimina toda la flexión parasitaria. La energía del motor y los pedales va directa a tus manos y pies, asegurando datos de telemetría limpios.",
      vs: "Estructuras comerciales tubulares, de madera o plegables que absorben la energía de los motores de alto torque, crujiendo y falseando el feedback real del neumático.",
      img: "assets/img/chasis.mp4"
    }
  };

  window.switchHardware = function (key) {
    // Gestionar Clases de Botones Activos
    document.querySelectorAll('.hw-console__btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`btn-${key}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Efecto glitch / parpadeo de plano técnico
    const mediaElement = document.getElementById('hw-blueprint-media');
    if (mediaElement) {
      mediaElement.style.opacity = '0.1';

      setTimeout(() => {
        // Inyección de contenidos y telemetría
        document.getElementById('hw-title').innerText = hardwareData[key].title;
        document.getElementById('hw-spec').innerHTML = hardwareData[key].spec;
        document.getElementById('hw-desc').innerText = hardwareData[key].desc;
        const hwVsElement = document.getElementById('hw-vs');
        if (hwVsElement) {
          hwVsElement.innerText = hardwareData[key].vs;
        }

        const sourceElement = mediaElement.querySelector('source');
        if (sourceElement) {
          sourceElement.src = hardwareData[key].img;
        } else {
          mediaElement.src = hardwareData[key].img;
        }

        const onLoadedData = () => {
          mediaElement.style.opacity = '1';
          mediaElement.play().catch(e => console.log('Autoplay prevent error:', e));
          mediaElement.removeEventListener('loadeddata', onLoadedData);
        };

        mediaElement.style.opacity = '0.1';
        mediaElement.addEventListener('loadeddata', onLoadedData);
        mediaElement.load();
      }, 150);
    }
  };


  /* ----------------------------------------------------------------
       10. DOTS DE PAGINACIÓN — BENEFICIOS (mobile)
       Actualiza qué dot está activo en función de la posición del
       scroll horizontal del track. Solo se activa si el track tiene
       scroll (es decir, en mobile; en desktop no hace nada).
    ---------------------------------------------------------------- */
  const beneficiosTrack = document.getElementById('beneficios-track');
  const beneficiosDots = document.querySelectorAll('#beneficios-dots .beneficios__dot');

  if (beneficiosTrack && beneficiosDots.length) {
    beneficiosTrack.addEventListener('scroll', () => {
      const cards = beneficiosTrack.querySelectorAll('.beneficios__card');
      const trackLeft = beneficiosTrack.getBoundingClientRect().left;
      let closestIndex = 0;
      let minDist = Infinity;

      cards.forEach((card, i) => {
        const dist = Math.abs(card.getBoundingClientRect().left - trackLeft);
        if (dist < minDist) { minDist = dist; closestIndex = i; }
      });

      beneficiosDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === closestIndex);
      });
    }, { passive: true });
  }

  /* ----------------------------------------------------------------
      VIDEO SCROLL-DRIVEN (versión suavizada con lerp + rAF)
   ---------------------------------------------------------------- */
  const wrapper = document.getElementById('scrollVideoWrapper');
  const video = document.getElementById('scrollVideo');

  if (wrapper && video) {
    const initScrollVideo = () => {
      let targetTime = 0;   // tiempo al que queremos llegar
      let currentTime = 0;   // tiempo actual suavizado
      let rafId = null;

      // LERP: mueve currentTime un 12% hacia targetTime en cada frame.
      const LERP_FACTOR = 0.10;

      function lerp(a, b, t) {
        return a + (b - a) * t;
      }

      function getProgress() {
        const wRect = wrapper.getBoundingClientRect();
        const wHeight = wrapper.offsetHeight;
        const winH = window.innerHeight;
        return Math.min(Math.max(-wRect.top / (wHeight - winH), 0), 1);
      }

      function tick() {
        const progress = getProgress();

        // ── El scroll controla el tiempo del video directamente ──────────
        targetTime = progress * video.duration;

        // ── Suavizá el currentTime con lerp ──────────────────
        currentTime = lerp(currentTime, targetTime, LERP_FACTOR);

        // Solo tocamos currentTime si el cambio es perceptible (> 1 frame a 30fps)
        if (Math.abs(currentTime - video.currentTime) > 0.033) {
          video.currentTime = currentTime;
        }

        rafId = requestAnimationFrame(tick);
      }

      // Arranca el loop al hacer scroll, lo para cuando no hay movimiento
      let scrollTimeout = null;

      window.addEventListener('scroll', () => {
        if (!rafId) {
          rafId = requestAnimationFrame(tick);
        }
        // Para el loop 300ms después de que el usuario deja de scrollear
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          cancelAnimationFrame(rafId);
          rafId = null;
        }, 300);
      }, { passive: true });

      // Estado inicial
      tick();
      setTimeout(() => {
        cancelAnimationFrame(rafId);
        rafId = null;
      }, 100);
    };

    if (video.readyState >= 1) {
      initScrollVideo();
    } else {
      video.addEventListener('loadedmetadata', initScrollVideo);
    }
  }

  /* ----------------------------------------------------------------
      IMAGE COMPARE SLIDER (Detalle Técnico)
   ---------------------------------------------------------------- */
  const imgCompareSlider = document.getElementById('imgCompareSlider');
  const imgCompareContainer = document.getElementById('imgCompareContainer');

  if (imgCompareSlider && imgCompareContainer) {
    imgCompareSlider.addEventListener('input', (e) => {
      imgCompareContainer.style.setProperty('--pos', `${e.target.value}%`);
    });
  }

});
