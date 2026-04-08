import React from 'react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <section className="hero" style={{backgroundImage: `linear-gradient(rgba(35, 79, 39, 0.8), rgba(42, 95, 46, 0.8)), url(${process.env.PUBLIC_URL}/foto%201.jpeg)`}}>
        <div className="hero-content">
          <h1 className="hero-title">FUNDETER</h1>
          <h2 className="hero-subtitle">Fundación para la Planeación y el Desarrollo Territorial</h2>
          <p className="hero-slogan">Planeamos y transformamos territorios con sentido social</p>
          <div className="hero-actions">
            <a href="/quienes-somos" className="cta-button">Conoce más</a>
            <a href="/contactos" className="cta-button secondary">Contáctanos</a>
          </div>
        </div>
      </section>

      <section className="aliados-preview">
        <div className="container">
          <h3>Nuestros Aliados</h3>
          <div className="aliados-grid">
            <div className="aliado-simple">
              <img src="/Aliado 1 con fondo.jpeg" alt="Universidad del Magdalena" />
            </div>
            <div className="aliado-simple">
              <img src="/Aliado 2 con fondo.jpg" alt="Aliado estratégico FUNDETER" />
            </div>
          </div>
        </div>
      </section>

      <section className="home-footer-bottom">
        <div className="container home-footer-bottom-content">
          <div className="home-footer-col">
            <h4>FUNDETER-ORG</h4>
            <p>
              Somos una entidad sin ánimo de lucro con sede en Santa Marta - Magdalena, con más de 12 años de trayectoria institucional. Planeamos y transformamos territorios con sentido social.
            </p>
          </div>
          <div className="home-footer-col">
            <h4>Información de contacto</h4>
            <p>✉️ info@fundeter.org</p>
            <p>📲+57 313 744 9160</p>
            <p>📍 Carrera 66 # 48 - 106 Casa M3 Urbanización San Lorenzo, Santa Marta D.T.C.H. - Colombia.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;


