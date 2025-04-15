import React from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useLocation, 
  useParams
} from 'react-router-dom';
import { IptvProvider } from './context/IptvContext';
import { AuthProvider } from './context/AuthContext'; // Import the AuthProvider
import Home from './pages/Home';
import Settings from './pages/Settings';
import Watch from './pages/Watch';
import Navigation from './components/Navigation';
import AuthForm from './pages/Register';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile'; // New profile page component

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
      <AuthProvider> {/* Wrap everything in AuthProvider to provide auth context */}
        <IptvProvider>
          <BrowserRouter>
            <div className="app">
              <Navigation />
              <Routes>
                {/* Public routes: Login & Register */}
                <Route path="login" element={<LocationAwareRoute Component={Login} />} />
                <Route path="register" element={<LocationAwareRoute Component={AuthForm} />} />
                
                {/* Protected routes */}
                <Route
                  index
                  element={
                    <ProtectedRoute>
                      <LocationAwareRoute Component={Home} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="watch"
                  element={
                    <ProtectedRoute>
                      <WatchWithRemount />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="watch/:streamId"
                  element={
                    <ProtectedRoute>
                      <WatchWithRemount />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute>
                      <LocationAwareRoute Component={Settings} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <LocationAwareRoute Component={Profile} />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </BrowserRouter>
        </IptvProvider>
      </AuthProvider>
  );
}

export default App;
