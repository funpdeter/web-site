import React from 'react';
import './QuienesSomos.css';

const QuienesSomos: React.FC = () => {
  return (
    <div className="quienes-somos">
      <section className="page-hero">
        <div className="page-hero-content">
          <h1>Quienes Somos</h1>
          <p>Conoce nuestra historia, misión y el equipo que trabaja por el desarrollo territorial</p>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <div className="content-grid">
            <div className="content-text">
              <h2>¿Quiénes Somos?</h2>
              <p>
                Somos la Fundación para la Planeación y el Desarrollo Territorial – FUNPDETER,
                una entidad sin ánimo de lucro con sede en Santa Marta – Magdalena, con más de
                10 años de trayectoria institucional.
              </p>
              <p>
                Contamos con un equipo profesional altamente calificado en ingeniería, gerencia
                de proyectos y planeación estratégica, con experiencia comprobada en la asesoría
                a entidades estatales y privadas.
              </p>
            </div>
            <div className="content-image">
              <img src="/foto 2.jpeg" alt="Equipo trabajando" />
            </div>
          </div>
        </div>
      </section>

      <section className="mission-vision">
        <div className="container">
          <div className="mission-vision-grid">
            <div className="mission-card">
              <h3>Misión</h3>
              <p>
                Nuestra misión es asesorar a entidades públicas y organizaciones privadas en la
                formulación, gestión, administración, ejecución, seguimiento y evaluación de
                proyectos de inversión pública y privada, con un enfoque estratégico orientado
                a generar impactos sostenibles, transformadores y con sentido social en los
                territorios, mediante el uso eficiente de recursos nacionales e internacionales.
              </p>
            </div>
            <div className="vision-card">
              <h3>Visión</h3>
              <p>
                Posicionarnos a nivel nacional e internacional como aliados estratégicos de
                entidades públicas y privadas, liderando la gestión y ejecución de planes y
                proyectos de inversión que transformen social y sosteniblemente los territorios.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="purpose-section">
        <div className="container">
          <div className="purpose-card">
            <h2>Propósito</h2>
            <p>
              Asesoramos a entidades públicas y privadas en el ciclo completo de proyectos
              de inversión, impulsando el desarrollo territorial con impacto social,
              sostenibilidad y eficiencia.
            </p>
            <p className="purpose-highlight">
              En FUNPDETER, impulsamos proyectos y soluciones estratégicas que conectan la
              planeación con la acción transformadora, sostenible y con sentido social en
              los territorios.
            </p>
          </div>
        </div>
      </section>

      <section className="object-section">
        <div className="container">
          <div className="object-card">
            <h2>Objeto</h2>
            <div className="object-content">
              <p>
                Asesorar en la formulación, administración, seguimiento y evaluación de proyectos
                de inversión pública y privada a entidades del Estado, territoriales, así como a
                entidades privadas y mixtas en temas como investigación, ciencia, tecnología e
                innovación, planificación y desarrollo con el fin de aprovechar y canalizar recursos
                a nivel nacional e internacional para el desarrollo de las regiones.
              </p>
              <p>
                Orientar a los entes territoriales para gestionar recursos del Sistema General de
                Regalías para generar resultados de alto impacto. Difundir conocimiento acerca de
                metodologías para la estructuración de proyectos, programas y planes.
              </p>
              <p>
                Establecer alianzas, convenios y relaciones de cooperación con entidades y
                dependencias del orden nacional, departamental, distrital y municipal con el fin
                de apoyar la formulación, gestión, administración, ejecución, seguimiento y
                evaluación de planes, programas y proyectos en áreas como:
              </p>
              <div className="areas-grid">
                <div className="area-item">• Planeación territorial</div>
                <div className="area-item">• Gobierno y desarrollo social</div>
                <div className="area-item">• Economía popular</div>
                <div className="area-item">• Desarrollo económico</div>
                <div className="area-item">• Inclusión, equidad y género</div>
                <div className="area-item">• Transporte y movilidad</div>
                <div className="area-item">• Servicios públicos</div>
                <div className="area-item">• Educación y salud</div>
                <div className="area-item">• Riesgo climático y medio ambiente</div>
                <div className="area-item">• Tecnologías de la información (TIC)</div>
                <div className="area-item">• Fortalecimiento institucional</div>
                <div className="area-item">• Participación ciudadana</div>
                <div className="area-item">• Cultura, recreación y deporte</div>
                <div className="area-item">• Ejecución de contratos de obras civiles</div>
              </div>
              <p className="object-conclusion">
                Contribuyendo así al cumplimiento de los planes de desarrollo territoriales y a
                la transformación integral de los territorios en infraestructuras tecnológicas
                y civiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="values">
        <div className="container">
          <h2>Nuestros Valores</h2>
          <div className="values-grid">
            <div className="value-item">
              <h4>Compromiso Social</h4>
              <p>Trabajamos con y para las comunidades, priorizando siempre el bienestar colectivo.</p>
            </div>
            <div className="value-item">
              <h4>Transparencia</h4>
              <p>Actuamos con honestidad y claridad en todos nuestros procesos y relaciones.</p>
            </div>
            <div className="value-item">
              <h4>Excelencia Técnica</h4>
              <p>Contamos con profesionales altamente calificados en ingeniería y gerencia de proyectos.</p>
            </div>
            <div className="value-item">
              <h4>Sostenibilidad</h4>
              <p>Promovemos soluciones que generen impactos duraderos y respeten el medio ambiente.</p>
            </div>
            <div className="value-item">
              <h4>Innovación</h4>
              <p>Aplicamos metodologías innovadoras y tecnologías apropiadas para cada contexto.</p>
            </div>
            <div className="value-item">
              <h4>Eficiencia</h4>
              <p>Optimizamos el uso de recursos nacionales e internacionales para maximizar el impacto.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default QuienesSomos;