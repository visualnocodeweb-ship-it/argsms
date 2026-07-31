import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="landing">
      <header className="site-nav site-nav-glass">
        <Link to="/" className="brand">
          Mensajes <span>ARG</span>
        </Link>
        <nav className="nav-links">
          <span className="nav-status">
            <i /> network online
          </span>
          <Link to="/admin" className="btn btn-ghost btn-nav">
            Admin
          </Link>
        </nav>
      </header>

      <section className="hero hero-web3">
        <div className="hero-mesh" aria-hidden="true" />
        <div className="hero-orb hero-orb-a" aria-hidden="true" />
        <div className="hero-orb hero-orb-b" aria-hidden="true" />
        <div className="hero-gridlines" aria-hidden="true" />
        <div className="hero-signal" aria-hidden="true">
          <svg className="signal-network" viewBox="0 0 400 400" fill="none">
            <g className="net-links">
              <path d="M70 90 L140 130 L210 80 L280 140 L330 70" />
              <path d="M60 200 L130 180 L200 220 L270 170 L340 210" />
              <path d="M80 310 L150 270 L220 320 L300 260 L350 330" />
              <path d="M140 130 L130 180 L150 270" />
              <path d="M210 80 L200 220 L220 320" />
              <path d="M280 140 L270 170 L300 260" />
              <path d="M70 90 L60 200 L80 310" />
              <path d="M330 70 L340 210 L350 330" />
              <path d="M140 130 L200 220 L280 140" />
              <path d="M130 180 L220 320 L270 170" />
            </g>
            <g className="net-nodes">
              <circle cx="70" cy="90" r="3.5" />
              <circle cx="140" cy="130" r="4.5" />
              <circle cx="210" cy="80" r="3" />
              <circle cx="280" cy="140" r="5" />
              <circle cx="330" cy="70" r="3" />
              <circle cx="60" cy="200" r="3.5" />
              <circle cx="130" cy="180" r="5" />
              <circle cx="200" cy="220" r="6" />
              <circle cx="270" cy="170" r="4" />
              <circle cx="340" cy="210" r="3.5" />
              <circle cx="80" cy="310" r="3" />
              <circle cx="150" cy="270" r="4.5" />
              <circle cx="220" cy="320" r="3.5" />
              <circle cx="300" cy="260" r="5" />
              <circle cx="350" cy="330" r="3" />
            </g>
          </svg>
          <span className="signal-floor" />
          <span className="signal-core" />
          <span className="signal-ring signal-ring-1" />
          <span className="signal-ring signal-ring-2" />
          <span className="signal-ring signal-ring-3" />
          <span className="signal-ring signal-ring-dash" />
          <span className="signal-beam" />
          <span className="signal-scan" />
        </div>

        <div className="hero-layout hero-layout-solo">
          <div className="hero-glass">
            <div className="hero-chip">
              <span className="chip-dot" />
              PROTOCOL · SMS GATEWAY LAYER
            </div>
            <p className="hero-brand">
              Mensajes <em>ARG</em>
            </p>
            <h1>Infraestructura de mensajería SMS sobre gateways Android propios.</h1>
            <p className="hero-lead">
              Orquestá envíos programáticos desde tu stack: alertas críticas, notificaciones
              operativas y confirmaciones con entrega por red celular, independiente de la
              conectividad de datos del destinatario.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-web3" to="/admin">
                Acceder al panel
                <span className="btn-arrow">→</span>
              </Link>
              <div className="hero-meta">
                <span>SIM-native</span>
                <span>API-ready</span>
                <span>Low-latency</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="tech-divider" aria-hidden="true">
        <div className="tech-divider-frame">
          <span className="tech-divider-bracket tech-divider-bracket-l" />
          <div className="tech-divider-track">
            <span className="tech-divider-rail" />
            <span className="tech-divider-ticks" />
            <span className="tech-divider-glow" />
            <span className="tech-divider-beam" />
            <span className="tech-divider-pulse" />
          </div>
          <span className="tech-divider-bracket tech-divider-bracket-r" />
        </div>
        <div className="tech-divider-meta">
          <span>SIGNAL</span>
          <span>LINK · ACTIVE</span>
          <span>SYNC</span>
        </div>
      </div>

      <section className="tourism-lead" id="turismo">
        <div className="cases-stack tourism-lead-stack">
          <article className="case-feature case-feature-alt case-band case-band-tourism">
            <div className="case-glow" aria-hidden="true" />
            <div className="case-shine" aria-hidden="true" />
            <div className="case-frame" aria-hidden="true" />
            <div className="case-copy">
              <div className="hero-chip case-chip case-chip-tourism">
                <span className="chip-dot" />
                CASO · TURISMO Y SERVICIOS
              </div>
              <h3>SMS para centros de ski, hoteles y servicios turísticos</h3>
              <p>
                En destinos de montaña y centros de ski, la señal de datos es inestable en pista.
                El SMS llega igual: cierres de medios, alertas climáticas, turnos de clases, check-in
                hotelero y promos de after-ski sin depender del Wi‑Fi del visitante.
              </p>

              <div className="symbol-grid">
                <div className="symbol-card symbol-card-tourism">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      d="M8 34L24 10l16 24H8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                    <path d="M18 34l6-10 6 10" fill="none" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                  <strong>Operación de montaña</strong>
                  <span>Cierre de pistas, viento, riesgo de avalanche y medios técnicos.</span>
                </div>
                <div className="symbol-card symbol-card-tourism">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <rect x="10" y="16" width="28" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M10 22h28M18 16v-3h12v3" fill="none" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                  <strong>Hotelería</strong>
                  <span>Check-in, late checkout, upgrades y avisos de amenities.</span>
                </div>
                <div className="symbol-card symbol-card-tourism">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M24 14v10l6 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                  <strong>Clases y turnos</strong>
                  <span>Escuela de ski, guías y actividades outdoor reprogramadas.</span>
                </div>
                <div className="symbol-card symbol-card-tourism">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      d="M12 32c4-10 10-14 12-14s8 4 12 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path d="M16 32h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx="24" cy="14" r="3.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                  <strong>Experiencia del huésped</strong>
                  <span>Welcome SMS, shuttle, gastronomía y after-ski.</span>
                </div>
              </div>

              <div className="case-example case-example-tourism">
                <span>Ejemplo de alerta turística</span>
                <p>
                  CENTRO DE SKI: Viento fuerte en cumbre. Medios superiores cerrados hasta 14hs.
                  Clases reprogramadas. Info en base y por SMS oficial.
                </p>
              </div>
            </div>
            <div className="case-media case-media-tourism">
              <img
                src="/caso-turismo-ski.jpg"
                alt="Centro de ski en montaña nevada con medios de elevación"
              />
              <div className="case-media-fade case-media-fade-alt" />
              <div className="case-scan" aria-hidden="true" />
              <div className="care-badge tourism-badge">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4 18L12 5l8 13H4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
                Montaña · Ski · Servicios
              </div>
            </div>
          </article>
        </div>
      </section>

      <div className="tech-divider" aria-hidden="true">
        <div className="tech-divider-frame">
          <span className="tech-divider-bracket tech-divider-bracket-l" />
          <div className="tech-divider-track">
            <span className="tech-divider-rail" />
            <span className="tech-divider-ticks" />
            <span className="tech-divider-glow" />
            <span className="tech-divider-beam" />
            <span className="tech-divider-pulse" />
          </div>
          <span className="tech-divider-bracket tech-divider-bracket-r" />
        </div>
        <div className="tech-divider-meta">
          <span>SIGNAL</span>
          <span>LINK · ACTIVE</span>
          <span>SYNC</span>
        </div>
      </div>

      <section className="cases-section" id="casos">
        <div className="cases-intro-wrap">
          <div className="cases-intro">
            <span className="cases-kicker">Casos útiles</span>
            <h2>Cuando el SMS es infraestructura crítica.</h2>
            <p>
              Desde crisis territoriales y turismo de montaña hasta redes de contención y comercio:
              el SMS llega por la red celular aunque no haya datos ni Wi‑Fi.
            </p>
          </div>
        </div>

        <div className="cases-stack">
          <article className="case-feature case-band case-band-emergency">
            <div className="case-glow" aria-hidden="true" />
            <div className="case-shine" aria-hidden="true" />
            <div className="case-frame" aria-hidden="true" />
            <div className="case-media">
              <img
                src="/caso-emergencias.jpg"
                alt="Zona rural de noche con incendio forestal en el horizonte"
              />
              <div className="case-media-fade" />
              <div className="case-scan" aria-hidden="true" />
            </div>
            <div className="case-copy">
              <div className="hero-chip case-chip">
                <span className="chip-dot" />
                CASO · EMERGENCIAS
              </div>
              <h3>Envío masivo en zonas de emergencia</h3>
              <p>
                Coordiná alertas geolocalizadas para municipios, defensa civil y organismos de
                respuesta. Mensajes ARG dispara SMS a listas por barrio, ruta o radio de impacto
                cuando hay incendios forestales, deslaves, inundaciones u otras crisis.
              </p>
              <ul className="case-points">
                <li>
                  <strong>Incendios forestales</strong>
                  Evacuación preventiva y rutas seguras para vecinos en riesgo.
                </li>
                <li>
                  <strong>Deslaves</strong>
                  Cortes de camino, zonas intransitables y puntos de encuentro.
                </li>
                <li>
                  <strong>Inundaciones</strong>
                  Avisos de crecida, desborde y asistencia inmediata.
                </li>
                <li>
                  <strong>Cobertura real</strong>
                  Llega aunque el destinatario no tenga datos ni Wi‑Fi.
                </li>
              </ul>
              <div className="case-example">
                <span>Ejemplo de alerta</span>
                <p>
                  DEFENSA CIVIL: Incendio activo en zona norte. Evacuar hacia Ruta 22. No circular
                  por caminos internos. Infórmese por SMS oficial.
                </p>
              </div>
            </div>
          </article>

          <div className="tech-divider" aria-hidden="true">
            <div className="tech-divider-frame">
              <span className="tech-divider-bracket tech-divider-bracket-l" />
              <div className="tech-divider-track">
                <span className="tech-divider-rail" />
                <span className="tech-divider-ticks" />
                <span className="tech-divider-glow" />
                <span className="tech-divider-beam" />
                <span className="tech-divider-pulse" />
              </div>
              <span className="tech-divider-bracket tech-divider-bracket-r" />
            </div>
            <div className="tech-divider-meta">
              <span>SIGNAL</span>
              <span>LINK · ACTIVE</span>
              <span>SYNC</span>
            </div>
          </div>

          <article className="case-feature case-feature-alt case-band case-band-care">
            <div className="case-glow" aria-hidden="true" />
            <div className="case-shine" aria-hidden="true" />
            <div className="case-frame" aria-hidden="true" />
            <div className="case-copy">
              <div className="hero-chip case-chip case-chip-care">
                <span className="chip-dot" />
                CASO · PREVENCIÓN Y ASISTENCIA
              </div>
              <h3>Red de alerta para prevención del suicidio y asistencia a la víctima</h3>
              <p>
                Una red discreta y confiable para organizaciones de salud mental, municipios y
                equipos de contención. El SMS permite activar acompañamiento inmediato, avisar a
                referentes de confianza y orientar hacia líneas de ayuda sin depender de apps ni
                datos móviles.
              </p>

              <div className="symbol-grid">
                <div className="symbol-card">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      d="M24 6l14 6v10c0 10.5-6.8 17.8-14 20-7.2-2.2-14-9.5-14-20V12l14-6z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    />
                    <path
                      d="M17 24l5 5 9-10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <strong>Contención segura</strong>
                  <span>Protocolos de alerta con privacidad y cuidado.</span>
                </div>
                <div className="symbol-card">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      d="M24 39s-13-8.2-13-17.2A7.8 7.8 0 0 1 24 16a7.8 7.8 0 0 1 13 5.8C37 30.8 24 39 24 39z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <strong>Cuidado humano</strong>
                  <span>Mensajes empáticos, claros y orientados a pedir ayuda.</span>
                </div>
                <div className="symbol-card">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <rect
                      x="12"
                      y="8"
                      width="24"
                      height="32"
                      rx="4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    />
                    <circle cx="24" cy="34" r="1.8" fill="currentColor" />
                    <path
                      d="M18 16h12M18 21h12M18 26h8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <strong>Línea de ayuda</strong>
                  <span>Derivación rápida a asistencia profesional 24/7.</span>
                </div>
                <div className="symbol-card">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="16" r="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <circle cx="12" cy="32" r="4" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <circle cx="36" cy="32" r="4" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path
                      d="M20 19.5L14.5 28.5M28 19.5l5.5 9M16 32h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <strong>Red de referentes</strong>
                  <span>Aviso a familiares, tutores o equipos de acompañamiento.</span>
                </div>
                <div className="symbol-card">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <rect
                      x="14"
                      y="20"
                      width="20"
                      height="16"
                      rx="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    />
                    <path
                      d="M18 20v-3a6 6 0 0 1 12 0v3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <circle cx="24" cy="28" r="2" fill="currentColor" />
                  </svg>
                  <strong>Privacidad</strong>
                  <span>Canales reservados, sin exposición pública innecesaria.</span>
                </div>
                <div className="symbol-card">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      d="M14 30c0-6.6 4.5-10 10-10s10 3.4 10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <circle cx="24" cy="16" r="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path
                      d="M10 36h28"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 36v4M30 36v4"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <strong>Asistencia a la víctima</strong>
                  <span>Guía a refugios, acompañamiento legal y apoyo psicológico.</span>
                </div>
              </div>

              <div className="case-example case-example-care">
                <span>Ejemplo de mensaje de contención</span>
                <p>
                  RED DE CUIDADO: No estás solo/a. Hay personas listas para ayudarte ahora. Escribí o
                  llamá a la línea de asistencia. Si estás en peligro inmediato, pedí ayuda a alguien
                  de confianza.
                </p>
              </div>
            </div>
            <div className="case-media case-media-care">
              <img
                src="/caso-alerta-prevencion.jpg?v=2"
                alt="Grupo de personas unidas en una plaza, símbolo de protección social y cuidado comunitario"
              />
              <div className="case-media-fade case-media-fade-alt" />
              <div className="case-scan" aria-hidden="true" />
              <div className="care-badge">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 21s-7-4.4-7-9.2A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 3.8C19 16.6 12 21 12 21z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>
                Escucha · Contención · Derivación
              </div>
            </div>
          </article>

          <div className="tech-divider" aria-hidden="true">
            <div className="tech-divider-frame">
              <span className="tech-divider-bracket tech-divider-bracket-l" />
              <div className="tech-divider-track">
                <span className="tech-divider-rail" />
                <span className="tech-divider-ticks" />
                <span className="tech-divider-glow" />
                <span className="tech-divider-beam" />
                <span className="tech-divider-pulse" />
              </div>
              <span className="tech-divider-bracket tech-divider-bracket-r" />
            </div>
            <div className="tech-divider-meta">
              <span>SIGNAL</span>
              <span>LINK · ACTIVE</span>
              <span>SYNC</span>
            </div>
          </div>

          <article className="case-feature case-feature-biz case-band case-band-biz">
            <div className="case-glow" aria-hidden="true" />
            <div className="case-shine" aria-hidden="true" />
            <div className="case-frame" aria-hidden="true" />
            <div className="case-media">
              <img
                src="/caso-empresas.jpg"
                alt="Mostrador de comercio con pedidos listos y celular iluminado para notificaciones"
              />
              <div className="case-media-fade" />
              <div className="case-scan" aria-hidden="true" />
              <div className="care-badge biz-badge">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4 7h16l-1.2 11.2A2 2 0 0 1 16.81 20H7.19a2 2 0 0 1-1.99-1.8L4 7z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>
                Ventas · Marketing · Retención
              </div>
            </div>
            <div className="case-copy">
              <div className="hero-chip case-chip case-chip-biz">
                <span className="chip-dot" />
                CASO · EMPRESAS Y WOOCOMMERCE
              </div>
              <h3>Marketing y seguimiento de compras por SMS</h3>
              <p>
                Conectá tu tienda, CRM o WooCommerce con Mensajes ARG para hablarle al cliente en el
                momento exacto: confirmación de compra, aviso de envío, promo flash o recompra.
                Alto open rate, sin depender de que abra el mail o tenga WhatsApp activo.
              </p>

              <div className="symbol-grid">
                <div className="symbol-card symbol-card-biz">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <rect x="8" y="12" width="32" height="24" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M8 18h32" stroke="currentColor" strokeWidth="2.2" />
                    <circle cx="14" cy="15" r="1.4" fill="currentColor" />
                    <circle cx="19" cy="15" r="1.4" fill="currentColor" />
                    <path d="M14 26h12M14 31h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <strong>WooCommerce</strong>
                  <span>Dispará SMS al crear pedido, pago o cambio de estado.</span>
                </div>
                <div className="symbol-card symbol-card-biz">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      d="M10 34V14l14-6 14 6v20l-14 6-14-6z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                    <path d="M24 8v28M10 14l14 6 14-6" fill="none" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                  <strong>Post-compra</strong>
                  <span>Confirmá la venta y reducí ansiedad del comprador.</span>
                </div>
                <div className="symbol-card symbol-card-biz">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      d="M24 8l3.5 10.5H38l-8.5 6.2 3.2 10.3L24 29.5l-8.7 5.5 3.2-10.3L10 18.5h10.5L24 8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <strong>Promos flash</strong>
                  <span>Campañas cortas con urgencia real y buena conversión.</span>
                </div>
                <div className="symbol-card symbol-card-biz">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M24 14v10l7 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                  <strong>Recordatorios</strong>
                  <span>Turnos, cuotas, carritos abandonados y reposición.</span>
                </div>
                <div className="symbol-card symbol-card-biz">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      d="M12 18h24l-2 18H14L12 18z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 18V14a6 6 0 0 1 12 0v4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    />
                  </svg>
                  <strong>Clientes que compran</strong>
                  <span>Segmentá por ticket, categoría o frecuencia de compra.</span>
                </div>
                <div className="symbol-card symbol-card-biz">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      d="M8 30c4-8 10-12 16-12s12 4 16 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path d="M16 30h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx="24" cy="14" r="4" fill="none" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                  <strong>Retención</strong>
                  <span>Reactivá clientes dormidos sin pagar APIs caras.</span>
                </div>
              </div>

              <div className="case-example case-example-biz">
                <span>Ejemplo de mensaje comercial</span>
                <p>
                  TIENDA NORTE: Gracias por tu compra #4521. Tu pedido sale mañana. 15% OFF en tu
                  próxima compra con código VUELVE15. Válido 48hs.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div className="tech-divider" aria-hidden="true">
        <div className="tech-divider-frame">
          <span className="tech-divider-bracket tech-divider-bracket-l" />
          <div className="tech-divider-track">
            <span className="tech-divider-rail" />
            <span className="tech-divider-ticks" />
            <span className="tech-divider-glow" />
            <span className="tech-divider-beam" />
            <span className="tech-divider-pulse" />
          </div>
          <span className="tech-divider-bracket tech-divider-bracket-r" />
        </div>
        <div className="tech-divider-meta">
          <span>SIGNAL</span>
          <span>LINK · ACTIVE</span>
          <span>SYNC</span>
        </div>
      </div>

      <section className="contact-section" id="contacto">
        <div className="contact-mesh" aria-hidden="true" />
        <div className="contact-orb contact-orb-a" aria-hidden="true" />
        <div className="contact-orb contact-orb-b" aria-hidden="true" />

        <div className="hero-signal contact-signal" aria-hidden="true">
          <svg className="signal-network contact-network" viewBox="0 0 400 400" fill="none">
            <g className="net-links">
              <path d="M70 90 L140 130 L210 80 L280 140 L330 70" />
              <path d="M60 200 L130 180 L200 220 L270 170 L340 210" />
              <path d="M80 310 L150 270 L220 320 L300 260 L350 330" />
              <path d="M140 130 L130 180 L150 270" />
              <path d="M210 80 L200 220 L220 320" />
              <path d="M280 140 L270 170 L300 260" />
              <path d="M70 90 L60 200 L80 310" />
              <path d="M330 70 L340 210 L350 330" />
              <path d="M140 130 L200 220 L280 140" />
              <path d="M130 180 L220 320 L270 170" />
            </g>
            <g className="net-nodes">
              <circle cx="70" cy="90" r="3.5" />
              <circle cx="140" cy="130" r="4.5" />
              <circle cx="210" cy="80" r="3" />
              <circle cx="280" cy="140" r="5" />
              <circle cx="330" cy="70" r="3" />
              <circle cx="60" cy="200" r="3.5" />
              <circle cx="130" cy="180" r="5" />
              <circle cx="200" cy="220" r="6" />
              <circle cx="270" cy="170" r="4" />
              <circle cx="340" cy="210" r="3.5" />
              <circle cx="80" cy="310" r="3" />
              <circle cx="150" cy="270" r="4.5" />
              <circle cx="220" cy="320" r="3.5" />
              <circle cx="300" cy="260" r="5" />
              <circle cx="350" cy="330" r="3" />
            </g>
          </svg>
          <span className="signal-floor contact-floor" />
          <span className="signal-core contact-core" />
          <span className="signal-ring signal-ring-1 contact-ring" />
          <span className="signal-ring signal-ring-2 contact-ring" />
          <span className="signal-ring signal-ring-3 contact-ring" />
          <span className="signal-ring signal-ring-dash contact-ring-dash" />
          <span className="signal-beam contact-beam" />
          <span className="signal-scan contact-scan-ring" />
          <div className="contact-labels">
            <span style={{ top: "18%", left: "22%" }}>IA</span>
            <span style={{ top: "28%", right: "18%" }}>API</span>
            <span style={{ top: "46%", left: "12%" }}>Automatización</span>
            <span style={{ top: "52%", right: "10%" }}>Conexión</span>
            <span style={{ bottom: "28%", left: "26%" }}>Webhooks</span>
            <span style={{ bottom: "18%", right: "22%" }}>SMS Gateway</span>
          </div>
        </div>

        <div className="hero-layout hero-layout-solo contact-layout">
          <div className="hero-glass contact-glass">
            <div className="hero-chip contact-chip">
              <span className="chip-dot" />
              CONTACTO · PRESUPUESTO
            </div>
            <p className="hero-brand contact-brand">
              Contactanos
            </p>
            <h1>Pedí tu presupuesto y activá tu red de mensajería.</h1>
            <p className="hero-lead">
              Integrá automatización, IA, APIs y conexión SMS en una sola capa operativa. Te
              armamos el esquema según tu volumen, dispositivos y casos de uso.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary btn-web3 btn-contact" href="mailto:hola@mensajesarg.com?subject=Pedido%20de%20presupuesto%20Mensajes%20ARG">
                Pedir presupuesto
                <span className="btn-arrow">→</span>
              </a>
              <Link className="btn btn-ghost btn-nav" to="/admin">
                Ver panel admin
              </Link>
            </div>
            <div className="hero-meta contact-meta">
              <span>Automatización</span>
              <span>IA</span>
              <span>API</span>
              <span>Conexión</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
