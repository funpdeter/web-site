import React, { useState } from 'react';
import './Contactos.css';

const Contactos: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Crear el asunto del email
    const subject = `Contacto desde web - ${formData.asunto}`;

    // Crear el cuerpo del email
    const body = `
Nombre: ${formData.nombre}
Email: ${formData.email}
Teléfono: ${formData.telefono || 'No proporcionado'}
Asunto: ${formData.asunto}

Mensaje:
${formData.mensaje}

---
Enviado desde el formulario de contacto de FUNPDETER
    `;

    // Crear el enlace mailto
    const mailtoLink = `mailto:funpdeter@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Abrir el cliente de email
    window.location.href = mailtoLink;

    // Resetear el formulario
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      asunto: '',
      mensaje: ''
    });
  };

  return (
    <div className="contactos">
      <section className="page-hero">
        <div className="page-hero-content">
          <h1>Contáctanos</h1>
          <p>Estamos aquí para escucharte y construir juntos las soluciones que necesitas</p>
        </div>
      </section>

      <section className="contacto-main">
        <div className="container">
          <div className="contacto-grid">
            <div className="contacto-info">
              <h2>Conversemos sobre tu proyecto</h2>
              <p>
                En FUNPDETER estamos comprometidos con el desarrollo territorial
                y el fortalecimiento de las comunidades. Contáctanos para conocer
                cómo podemos ayudarte.
              </p>

              <div className="info-cards">
                <div className="info-card">
                  <div className="info-icon">📧</div>
                  <div className="info-content">
                    <h3>Email</h3>
                    <p>funpdeter@gmail.com</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">📱</div>
                  <div className="info-content">
                    <h3>Teléfono</h3>
                    <p>+57 313 744 9160</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">📍</div>
                  <div className="info-content">
                    <h3>Ubicación</h3>
                    <p>Santa Marta – Magdalena</p>
                    <p>Servicio en todo el territorio nacional</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">🕒</div>
                  <div className="info-content">
                    <h3>Horarios</h3>
                    <p>Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                    <p>Sábados: 9:00 AM - 1:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contacto-form">
              <h2>Envíanos un mensaje</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="nombre">Nombre completo *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Correo electrónico *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="asunto">Asunto *</label>
                  <select
                    id="asunto"
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="planeacion">Planeación Territorial</option>
                    <option value="gestion">Gestión de Proyectos</option>
                    <option value="fortalecimiento">Fortalecimiento Institucional</option>
                    <option value="participacion">Participación Ciudadana</option>
                    <option value="desarrollo-rural">Desarrollo Rural</option>
                    <option value="consultoria">Consultoría Especializada</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="mensaje">Mensaje *</label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows={5}
                    value={formData.mensaje}
                    onChange={handleChange}
                    placeholder="Cuéntanos sobre tu proyecto o consulta..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn">
                  Enviar mensaje
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="colaboracion-section">
        <div className="container">
          <h2>Trabajemos juntos</h2>
          <p>
            Estamos abiertos a establecer alianzas estratégicas con organizaciones
            que compartan nuestro compromiso con el desarrollo territorial sostenible.
          </p>
          <div className="colaboracion-items">
            <div className="colaboracion-item">
              <h3>Entidades Públicas</h3>
              <p>Acompañamos a alcaldías, gobernaciones y entidades públicas en sus procesos de planeación y desarrollo.</p>
            </div>
            <div className="colaboracion-item">
              <h3>Organizaciones Sociales</h3>
              <p>Trabajamos con fundaciones, asociaciones y organizaciones comunitarias en proyectos de impacto social.</p>
            </div>
            <div className="colaboracion-item">
              <h3>Sector Privado</h3>
              <p>Desarrollamos alianzas con empresas comprometidas con la responsabilidad social empresarial.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contactos;