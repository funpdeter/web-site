import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import QuienesSomos from './pages/QuienesSomos';
import Proyectos from './pages/Proyectos';
import Servicios from './pages/Servicios';
import Contactos from './pages/Contactos';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quienes-somos" element={<QuienesSomos />} />
            <Route path="/proyectos" element={<Proyectos />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/contactos" element={<Contactos />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
