import React, { useState } from 'react';
import './Proyectos.css';

const Proyectos: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const proyectos = [
    {
      id: 1,
      titulo: "ASESORÍA EN ACTUALIZACIÓN Y FORMULACIÓN DE PROYECTOS DE INVERSIÓN PÚBLICA: ALUNA IA Y SU ESTRATEGIA IA EN TU COLEGIO",
      descripcion: "Proyecto de innovación educativa que integra inteligencia artificial en instituciones educativas, transformando los procesos de enseñanza y aprendizaje mediante tecnologías avanzadas.",
      categoria: "Tecnología e Innovación",
      estado: "En Ejecución",
      imagen: "/foto 1.jpeg",
      evidencias: ["/foto 1.jpeg", "/foto 2.jpeg"],
      detalles: "Implementación de soluciones de IA en el sector educativo para mejorar la calidad y accesibilidad de la educación, desarrollando capacidades tecnológicas en estudiantes y docentes."
    }
  ];

  return (
    <div className="proyectos">
      <section className="page-hero">
        <div className="page-hero-content">
          <h1>Nuestros Proyectos</h1>
          <p>Conoce los proyectos que hemos desarrollado para transformar territorios y comunidades</p>
        </div>
      </section>

      <section className="proyectos-section">
        <div className="container">
          <div className="proyectos-intro">
            <h2>Transformando territorios a través de proyectos</h2>
            <p>
              En FUNPDETER desarrollamos proyectos integrales que abordan las necesidades
              específicas de cada territorio, siempre con un enfoque participativo y sostenible.
            </p>
          </div>

          <div className="proyectos-grid">
            {proyectos.map((proyecto) => (
              <div key={proyecto.id} className="proyecto-card">
                <div className="proyecto-image">
                  <img src={proyecto.imagen} alt={proyecto.titulo} />
                  <div className="proyecto-overlay">
                    <span className={`estado ${proyecto.estado.toLowerCase().replace(' ', '-')}`}>
                      {proyecto.estado}
                    </span>
                  </div>
                </div>
                <div className="proyecto-content">
                  <div className="proyecto-categoria">{proyecto.categoria}</div>
                  <h3>{proyecto.titulo}</h3>
                  <p>{proyecto.descripcion}</p>
                  <button
                    className="ver-mas-btn"
                    onClick={() => setSelectedProject(proyecto.id)}
                  >
                    Ver más detalles
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedProject && (
            <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modal-close"
                  onClick={() => setSelectedProject(null)}
                >
                  ×
                </button>
                {(() => {
                  const proyecto = proyectos.find(p => p.id === selectedProject);
                  return proyecto ? (
                    <div>
                      <h2>{proyecto.titulo}</h2>
                      <div className="modal-body">
                        <div className="proyecto-info">
                          <div className="proyecto-meta">
                            <span className="categoria-badge">{proyecto.categoria}</span>
                            <span className={`estado-badge ${proyecto.estado.toLowerCase().replace(' ', '-')}`}>
                              {proyecto.estado}
                            </span>
                          </div>
                          <p className="proyecto-descripcion-completa">{proyecto.detalles}</p>
                        </div>
                        <div className="evidencias-section">
                          <h3>Evidencias del Proyecto</h3>
                          <div className="evidencias-grid">
                            {proyecto.evidencias.map((evidencia, index) => (
                              <div key={index} className="evidencia-item">
                                <img src={evidencia} alt={`Evidencia ${index + 1} - ${proyecto.titulo}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>¿Tienes un proyecto en mente?</h2>
          <p>Conversemos sobre cómo podemos ayudarte a transformar tu territorio</p>
          <a href="/contactos" className="cta-button">Contacta con nosotros</a>
        </div>
      </section>
    </div>
  );
};

export default Proyectos;