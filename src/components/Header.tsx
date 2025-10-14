import React, { useState } from 'react';
import './Header.css';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img src="/Logo.png" alt="FUNPDETER Logo" className="logo-img" />
        </div>

        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <a href="/" className="nav-link">Inicio</a>
          <a href="/quienes-somos" className="nav-link">Quienes Somos</a>
          <a href="/proyectos" className="nav-link">Proyectos</a>
          <a href="/servicios" className="nav-link">Servicios</a>
          <a href="/contactos" className="nav-link">Contactos</a>
        </nav>

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