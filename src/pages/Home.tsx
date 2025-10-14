import React from 'react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <section className="hero" style={{backgroundImage: `linear-gradient(rgba(35, 79, 39, 0.8), rgba(42, 95, 46, 0.8)), url(${process.env.PUBLIC_URL}/foto%202.jpeg)`}}>
        <div className="hero-content">
          <h1 className="hero-title">FUNPDETER</h1>
          <h2 className="hero-subtitle">Fundación para la Planeación y el Desarrollo Territorial</h2>
          <p className="hero-slogan">Planeamos, gestionamos, ejecutamos y transformamos con sentido social</p>
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
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;