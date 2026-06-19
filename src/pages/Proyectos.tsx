import React, { useEffect, useState } from 'react';
import { playSpacebarClick, unlockKeyboardClickAudio } from '../audioEffects';
import './Proyectos.css';

interface Articulo {
  titulo: string;
  doi: string;
  revista: string;
}

interface Proyecto {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  imagen: string;
  evidencias: string[];
  evidenciasListado?: string[];
  detalles: string;
  articulos?: Articulo[];
}

const Proyectos: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const getEstadoClass = (estado: string) =>
    estado
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');

  useEffect(() => {
    window.addEventListener('pointerdown', unlockKeyboardClickAudio, { once: true });
    window.addEventListener('keydown', unlockKeyboardClickAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockKeyboardClickAudio);
      window.removeEventListener('keydown', unlockKeyboardClickAudio);
    };
  }, []);

  const proyectos: Proyecto[] = [
    {
      id: 1,
      titulo: 'ASESORÍA EN ACTUALIZACIÓN Y FORMULACIÓN DE PROYECTOS DE INVERSIÓN PÚBLICA: ALUNA IA Y SU ESTRATEGIA IA EN TU COLEGIO',
      descripcion:
        'Proyecto de innovación educativa que integra inteligencia artificial en instituciones educativas, transformando los procesos de enseñanza y aprendizaje mediante tecnologías avanzadas.',
      categoria: 'Tecnología e Innovación',
      estado: 'Finalizado',
      imagen: '/ALUNA IA 2.webp',
      evidencias: ['/ALUNA IA 2.webp', '/foto 3.webp'],
      detalles:
        'Implementación de soluciones de IA en el sector educativo para mejorar la calidad y accesibilidad de la educación, desarrollando capacidades tecnológicas en estudiantes y docentes.'
    },
    {
      id: 2,
      titulo: 'ASESORÍA EN DESARROLLO ELECTRÓNICO Y APLICACIONES MÓVILES - GIDEAM Y LA DIVULGACIÓN DE TRES ARTÍCULOS CIENTÍFICOS',
      descripcion:
        'Proyecto de asesoría técnica y científica en desarrollo electrónico y aplicaciones móviles, con énfasis en investigación aplicada y divulgación científica de resultados.',
      categoria: 'Investigación y Desarrollo',
      estado: 'Finalizado',
      imagen: '/capac2_gideam.webp',
      evidencias: ['/capac2_gideam.webp', '/resultados_1.webp', '/resultados_2.webp'],
      detalles:
        'Proyecto de asesoría especializada en desarrollo de sistemas electrónicos y aplicaciones móviles, generando conocimiento científico aplicado. Los resultados de este proyecto han sido publicados en revistas científicas internacionales de alto impacto.',
      articulos: [
        {
          titulo:
            'Assessment of Dataset Scalability for Classification of Black Sigatoka in Banana Crops Using UAV-Based Multispectral Images and Deep Learning Techniques',
          doi: 'https://doi.org/10.3390/drones8090503',
          revista: 'Drones, 2024, 8(9), 503'
        },
        {
          titulo:
            'SVMobileNetV2: A Hybrid and Hierarchical CNN-SVM Network Architecture Utilising UAV-Based Multispectral Images and IoT Nodes for the Precise Classification of Crop Diseases',
          doi: 'https://doi.org/10.3390/agriengineering7100341',
          revista: 'AgriEngineering, 2025, 7(10), 341'
        },
        {
          titulo: 'Canopy Extraction in a Banana Crop From UAV Captured Multispectral Images',
          doi: 'https://doi.org/10.1109/CONCAPAN48024.2022.9997598',
          revista: '2022 IEEE 40th Central America and Panama Convention (CONCAPAN)'
        }
      ]
    },
    {
      id: 3,
      titulo:
        'ASESORÍA EN ACTUALIZACIÓN Y FORMULACIÓN DE PROYECTOS DE INVERSIÓN PÚBLICA: ALUNA IA Y EDIFICIOS DE LABORATORIOS PARA CTeI',
      descripcion:
        'Proyecto de asesoría técnica en formulación de proyectos de infraestructura tecnológica y especializada con el fin de generar capacidades para el desarrollo integral de la formación, investigación e innovación.',
      categoria: 'Proyectos de Infraestructura',
      estado: 'En Ejecución',
      imagen: '/Investigaciones2.webp',
      evidencias: ['/Investigaciones2.webp', '/Aluna_IA.webp'],
      evidenciasListado: [
        'Documentos técnicos',
        'Fichas MGA',
        'Acompañamiento en mesas técnicas con el Ministerio de Educación Nacional'
      ],
      detalles:
        'Proyecto de asesoría técnica en formulación de proyectos de infraestructura tecnológica y especializada con el fin de generar capacidades para el desarrollo integral de la formación, investigación e innovación.'
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
              En FUNDETER desarrollamos proyectos integrales que abordan las necesidades
              específicas de cada territorio, siempre con un enfoque participativo y sostenible.
            </p>
          </div>

          <div className="proyectos-grid">
            {proyectos.map((proyecto) => (
              <div
                key={proyecto.id}
                className="proyecto-card"
                onMouseEnter={playSpacebarClick}
                onPointerDown={playSpacebarClick}
              >
                <div className="proyecto-image">
                  <img src={proyecto.imagen} alt={proyecto.titulo} loading="lazy" decoding="async" />
                  <div className="proyecto-overlay">
                    <span className={`estado ${getEstadoClass(proyecto.estado)}`}>
                      {proyecto.estado}
                    </span>
                  </div>
                </div>
                <div className="proyecto-content">
                  <div className="proyecto-categoria">{proyecto.categoria}</div>
                  <h3>{proyecto.titulo}</h3>
                  <p>{proyecto.descripcion}</p>
                  <button className="ver-mas-btn" onClick={() => setSelectedProject(proyecto.id)}>
                    Ver más detalles
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedProject && (
            <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setSelectedProject(null)}>
                  ×
                </button>
                {(() => {
                  const proyecto = proyectos.find((p) => p.id === selectedProject);
                  return proyecto ? (
                    <div>
                      <h2>{proyecto.titulo}</h2>
                      <div className="modal-body">
                        <div className="proyecto-info">
                          <div className="proyecto-meta">
                            <span className="categoria-badge">{proyecto.categoria}</span>
                            <span className={`estado-badge ${getEstadoClass(proyecto.estado)}`}>
                              {proyecto.estado}
                            </span>
                          </div>
                          <p className="proyecto-descripcion-completa">{proyecto.detalles}</p>

                          {proyecto.articulos && proyecto.articulos.length > 0 && (
                            <div className="articulos-section">
                              <h3>Artículos Científicos Publicados</h3>
                              <div className="articulos-list">
                                {proyecto.articulos.map((articulo) => (
                                  <div key={articulo.doi} className="articulo-item">
                                    <h4 className="articulo-titulo">{articulo.titulo}</h4>
                                    <p className="articulo-revista">{articulo.revista}</p>
                                    <p className="articulo-doi">
                                      <span className="articulo-doi-icon" aria-hidden="true">
                                        📄
                                      </span>
                                      <a href={articulo.doi} target="_blank" rel="noopener noreferrer">
                                        {articulo.doi}
                                      </a>
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="evidencias-section">
                          <h3>Evidencias del Proyecto</h3>
                          {proyecto.evidenciasListado && proyecto.evidenciasListado.length > 0 && (
                            <ul className="evidencias-listado">
                              {proyecto.evidenciasListado.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          )}
                          <div className="evidencias-grid">
                            {proyecto.evidencias.map((evidencia, index) => (
                              <div key={index} className="evidencia-item">
                                <img
                                  className={evidencia === '/foto 3.webp' ? 'evidencia-foto-3' : undefined}
                                  src={evidencia}
                                  alt={`Evidencia ${index + 1} - ${proyecto.titulo}`}
                                  loading="lazy"
                                  decoding="async"
                                />
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
          <p>
            Buscamos aliados estratégicos, instituciones y empresas comprometidas con la
            transformación territorial y la innovación social.
          </p>
          <p>Impulsemos el desarrollo juntos.</p>
          <a href="/contactos" className="cta-button">
            <span className="cta-button-inner">
              <span>Contactos para aliados</span>
              <span className="cta-arrow-box" aria-hidden="true">↗︎</span>
            </span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Proyectos;

