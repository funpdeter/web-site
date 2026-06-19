import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import QuienesSomos from './pages/QuienesSomos';
import Proyectos from './pages/Proyectos';
import Servicios from './pages/Servicios';
import GestionUCI from './pages/GestionUCI';
import Contactos from './pages/Contactos';
import './App.css';

function App() {
  const [heroContentVisible, setHeroContentVisible] = useState(true);

  return (
    <Router>
      <div className="App">
        <Header
          heroContentVisible={heroContentVisible}
          onToggleHeroContent={() => setHeroContentVisible((isVisible) => !isVisible)}
        />
        <main>
          <Routes>
            <Route path="/" element={<Home heroContentVisible={heroContentVisible} />} />
            <Route path="/quienes-somos" element={<QuienesSomos />} />
            <Route path="/proyectos" element={<Proyectos />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/gestion-int" element={<GestionUCI />} />
            <Route path="/gestion-uci" element={<Navigate to="/gestion-int" replace />} />
            <Route path="/contactos" element={<Contactos />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
