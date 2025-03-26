import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { IptvProvider } from './context/IptvContext';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Watch from './pages/Watch'
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <IptvProvider>
        <BrowserRouter>
          <div className="app">
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/watch" element={<Watch/>} />
            </Routes>
          </div>
        </BrowserRouter>
      </IptvProvider>
    </ErrorBoundary>
  );
}

export default App;
