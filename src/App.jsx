import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { IPTVProvider } from './contexts/IPTVContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Settings from './pages/Settings';
import './App.css';
import DebugPanel from './components/DebugPanel';

function App() {
  return (
    <Router>
      <IPTVProvider>
        <div className="app">
          <Navigation />
          <main className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/watch" element={<Watch />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/debug" element={<DebugPanel />} />
            </Routes>
          </main>
        </div>
      </IPTVProvider>
    </Router>
  );
}

export default App;
