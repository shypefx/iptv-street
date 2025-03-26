import React from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useLocation, 
  useParams,
  useNavigate 
} from 'react-router-dom';
import { IptvProvider } from './context/IptvContext';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Watch from './pages/Watch';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';

// Composant wrapper pour forcer le remontage complet à chaque navigation
function LocationAwareRoute({ Component }) {
  const location = useLocation();
  const params = useParams();
  
  // Utiliser location.key comme clé unique pour forcer un remontage
  return <Component key={`${location.key}-${JSON.stringify(params)}`} />;
}

// Version spécifique pour Watch qui garantit son remontage
function WatchWithRemount() {
  const location = useLocation();
  const { streamId } = useParams();
  
  // Utiliser une combinaison de paramètres pour forcer le remontage
  return <Watch key={`watch-${streamId}-${location.key}`} />;
}

function App() {
  return (
    <ErrorBoundary>
      <IptvProvider>
        <BrowserRouter>
          <div className="app">
            <Navigation />
            <Routes>
              <Route index element={<LocationAwareRoute Component={Home} />} />
              <Route path="watch" element={<WatchWithRemount />} />
              <Route path="watch/:streamId" element={<WatchWithRemount />} />
              <Route path="settings" element={<LocationAwareRoute Component={Settings} />} />
            </Routes>
          </div>
        </BrowserRouter>
      </IptvProvider>
    </ErrorBoundary>
  );
}

export default App;
