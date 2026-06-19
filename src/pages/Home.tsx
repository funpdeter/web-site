import React, { useEffect, useState } from 'react';
import { playSpacebarClick, unlockKeyboardClickAudio } from '../audioEffects';
import './Home.css';

const heroSlides = [
  { image: '/front1.webp', position: 'center 8%' },
  { image: '/front2.webp', position: 'center 48%' }
];

interface HomeProps {
  heroContentVisible: boolean;
}

const Home: React.FC<HomeProps> = ({ heroContentVisible }) => {
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroImageIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    window.addEventListener('pointerdown', unlockKeyboardClickAudio, { once: true });
    window.addEventListener('keydown', unlockKeyboardClickAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockKeyboardClickAudio);
      window.removeEventListener('keydown', unlockKeyboardClickAudio);
    };
  }, []);

  return (
    <div className="home">
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(rgba(46, 121, 203, 0.42), rgba(46, 121, 203, 0.42)), url(${process.env.PUBLIC_URL}${heroSlides[heroImageIndex].image})`,
          backgroundPosition: heroSlides[heroImageIndex].position
        }}
      >
        <div className={`hero-content ${heroContentVisible ? '' : 'hero-content-collapsed'}`} aria-hidden={!heroContentVisible}>
          <h1 className="hero-title" aria-label="FUNDETER">
            <span className="hero-title-letter">F</span>
            <span className="hero-title-letter">U</span>
            <span className="hero-title-letter hero-title-inverted-u" aria-hidden="true">U</span>
            <span className="hero-title-letter">D</span>
            <span className="hero-title-letter">E</span>
            <span className="hero-title-letter">T</span>
            <span className="hero-title-letter">E</span>
            <span className="hero-title-letter">R</span>
          </h1>
          <h2 className="hero-subtitle">
            FUNDACIÓN PARA LA PLANEACIÓN
            <br />
            Y EL DESARROLLO TERRITORIAL
          </h2>
          <p className="hero-slogan">Planeamos y transformamos territorios con sentido social</p>
          <div className="hero-actions">
            <a href="/quienes-somos" className="cta-button" onMouseEnter={playSpacebarClick} onPointerDown={playSpacebarClick}>Conoce más</a>
            <a href="/contactos" className="cta-button secondary" onMouseEnter={playSpacebarClick} onPointerDown={playSpacebarClick}>Contáctanos</a>
          </div>
        </div>
      </section>

      <section className="aliados-preview">
        <div className="container">
          <h3>Nuestros Aliados</h3>
          <div className="aliados-grid">
            <div className="aliado-simple" onMouseEnter={playSpacebarClick} onPointerDown={playSpacebarClick}>
              <img
                src="/Aliado 1 con fondo.webp"
                alt="Universidad del Magdalena"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="aliado-simple" onMouseEnter={playSpacebarClick} onPointerDown={playSpacebarClick}>
              <img
                src="/Aliado 2 con fondo.webp"
                alt="Aliado estratégico FUNDETER"
                loading="lazy"
                decoding="async"
              />
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


