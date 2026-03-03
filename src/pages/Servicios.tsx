import React from 'react';
import './Servicios.css';

const Servicios: React.FC = () => {
  const servicios = [
    {
      id: 1,
      titulo: 'Formación y Liderazgo',
      descripcion:
        'Diseño e implementación de programas educativos de capacitación en liderazgo transformacional con énfasis en formulación de proyectos.',
      icono: '👨‍💼',
      caracteristicas: [
        'Liderazgo Transformacional',
        'Formulación de Proyectos',
        'Programas Educativos',
        'Capacitación Gerencial'
      ]
    },
    {
      id: 2,
      titulo: 'Educación Innovadora',
      descripcion:
        'Formulación y ejecución de proyectos orientados al fortalecimiento de capacidades institucionales en el marco de estrategias como Universidad en tu Colegio.',
      icono: '🎓',
      caracteristicas: [
        'Universidad en tu Colegio',
        'Fortalecimiento Institucional',
        'Capacidades Educativas',
        'Innovación Pedagógica'
      ]
    },
    {
      id: 3,
      titulo: 'Infraestructura Modular',
      descripcion: 'Suministro e implementación de sistemas modulares para espacios educativos.',
      icono: '🏗️',
      caracteristicas: [
        'Sistemas Modulares',
        'Espacios Educativos',
        'Construcción Flexible',
        'Diseño Funcional'
      ]
    },
    {
      id: 4,
      titulo: 'Infraestructura Tecnológica y Energías Alternativas',
      descripcion:
        'Diseño e implementación de soluciones para dotación tecnológica, conectividad rural, entornos digitales educativos, y proyectos de energías limpias.',
      icono: '⚡',
      caracteristicas: [
        'Dotación Tecnológica',
        'Conectividad Rural',
        'Entornos Digitales Educativos',
        'Sistemas Solares Autónomos'
      ]
    },
    {
      id: 5,
      titulo: 'Tecnología Aplicada al Desarrollo',
      descripcion:
        'Desarrollo de soluciones digitales para la visualización y análisis de indicadores que orienten decisiones de alto impacto en planes y proyectos territoriales.',
      icono: '💻',
      caracteristicas: [
        'Soluciones Digitales',
        'Análisis de Indicadores',
        'Visualización de Datos',
        'Decisiones de Alto Impacto'
      ]
    },
    {
      id: 6,
      titulo: 'Educación y Tecnologías Emergentes',
      descripcion:
        'Diseño e implementación de programas educativos de capacitación en tecnologías para la agricultura de precisión como IoT y drones.',
      icono: '🚁',
      caracteristicas: [
        'Agricultura de Precisión',
        'Internet de las Cosas (IoT)',
        'Tecnología de Drones',
        'Territorios Productivos'
      ]
    },
    {
      id: 7,
      titulo: 'Medio Ambiente y Gestión del Riesgo',
      descripcion:
        'Diseño e implementación de sistemas de alertas tempranas, gestión del riesgo, cambio climático, sostenibilidad ambiental y agricultura sostenible.',
      icono: '🌍',
      caracteristicas: [
        'Sistemas de Alertas Tempranas',
        'Gestión del Riesgo Climático',
        'Caracterización Biofísica',
        'Agricultura Sostenible'
      ]
    },
    {
      id: 8,
      titulo: 'Intervención Social y Acompañamiento Comunitario',
      descripcion:
        'Formulación e intervención para la atención y fortalecimiento de poblaciones vulnerables, incluyendo comunidades rurales, étnicas, jóvenes, mujeres y víctimas del conflicto.',
      icono: '🤝',
      caracteristicas: [
        'Poblaciones Vulnerables',
        'Comunidades Étnicas',
        'Enfoque Territorial',
        'Desarrollo Social Integral'
      ]
    },
    {
      id: 9,
      titulo: 'Comunicación Estratégica',
      descripcion:
        'Diseño de campañas y piezas comunicativas que fortalecen la relación entre instituciones y ciudadanía, visibilizando los impactos de la gestión pública.',
      icono: '📢',
      caracteristicas: [
        'Campañas Comunicativas',
        'Relación Institucional',
        'Visibilización de Impactos',
        'Gestión Pública Efectiva'
      ]
    }
  ];

  return (
    <div className="servicios">
      <section className="page-hero">
        <div className="page-hero-content">
          <h1>Nuestros Servicios</h1>
          <p>Ofrecemos soluciones integrales para el desarrollo territorial y el fortalecimiento institucional</p>
        </div>
      </section>

      <section className="servicios-intro">
        <div className="container">
          <h2>Servicios especializados para el desarrollo territorial</h2>
          <p>
            En FUNDETER ofrecemos una amplia gama de servicios diseñados para
            responder a las necesidades específicas de cada territorio y comunidad.
            Nuestro enfoque integral combina experiencia técnica con compromiso social.
          </p>
        </div>
      </section>

      <section className="servicios-grid-section">
        <div className="container">
          <div className="servicios-grid">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="servicio-card">
                <div className="servicio-header">
                  <div className="servicio-icono">{servicio.icono}</div>
                  <h3>{servicio.titulo}</h3>
                </div>
                <p className="servicio-descripcion">{servicio.descripcion}</p>
                <div className="servicio-caracteristicas">
                  <h4>Incluye:</h4>
                  <ul>
                    {servicio.caracteristicas.map((caracteristica, index) => (
                      <li key={index}>{caracteristica}</li>
                    ))}
                  </ul>
                </div>
                <a href="/contactos" className="solicitar-btn">Solicitar información</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-servicios">
        <div className="container">
          <h2>¿Necesitas alguno de nuestros servicios?</h2>
          <p>Contáctanos para una consulta personalizada y construyamos juntos la solución que necesitas</p>
          <div className="cta-buttons">
            <a href="/contactos" className="cta-button primary">Solicitar cotización</a>
            <a href="/proyectos" className="cta-button secondary">Ver nuestros proyectos</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Servicios;
