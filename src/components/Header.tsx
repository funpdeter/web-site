import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { playSpacebarClick } from '../audioEffects';
import './Header.css';

interface HeaderProps {
  heroContentVisible: boolean;
  onToggleHeroContent: () => void;
}

const Header: React.FC<HeaderProps> = ({ heroContentVisible, onToggleHeroContent }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const showHeroToggle = location.pathname === '/';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img
            src="/FUNDETER/FUNDETER/VARIACIONES/1.webp"
            alt="FUNPDETER Logo"
            className="logo-img"
            decoding="async"
          />
        </div>

        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <a href="/" className="nav-link">Inicio</a>
          <a href="/quienes-somos" className="nav-link">¿Quiénes Somos?</a>
          <a href="/proyectos" className="nav-link">Proyectos</a>
          <a href="/servicios" className="nav-link">Servicios</a>
          <a href="/gestion-int" className="nav-link">Gestión-Int</a>
          <a href="/contactos" className="nav-link">Contactos</a>
          <div className="paypal-donation">
            <form
              action="https://www.paypal.com/ncp/payment/6AUVVCR8C3J4N"
              method="post"
              target="_blank"
              className="paypal-donation-form"
            >
              <input className="pp-6AUVVCR8C3J4N" type="submit" value="DONACIONES" />
              <img
                className="paypal-cards"
                src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
                alt="cards"
              />
              <section className="paypal-tech">
                Con la tecnología de{' '}
                <img
                  src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                  alt="paypal"
                />
              </section>
            </form>
          </div>
        </nav>

        {showHeroToggle && (
          <button
            type="button"
            className={`hero-content-toggle ${heroContentVisible ? '' : 'is-collapsed'}`}
            aria-label={heroContentVisible ? 'Ocultar contenido principal' : 'Mostrar contenido principal'}
            aria-expanded={heroContentVisible}
            onClick={onToggleHeroContent}
            onMouseEnter={playSpacebarClick}
            onPointerDown={playSpacebarClick}
          >
            <span className="hero-content-toggle-chevron" aria-hidden="true"></span>
          </button>
        )}

        <button
          className="menu-toggle"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
};

export default Header;


