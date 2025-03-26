// src/components/RouteMonitor.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function RouteMonitor() {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log(`[Router] Navigation vers: ${location.pathname}${location.search}${location.hash} (key: ${location.key})`);
    
    // Récupération après erreur de navigation
    const handleRouteError = (event) => {
      console.error("[Router] Erreur lors d'un changement de route:", event);
      
      // Tenter une redirection en cas d'erreur critique
      if (event.reason && event.reason.message && event.reason.message.includes('navigation')) {
        console.warn("[Router] Tentative de récupération après erreur de navigation");
        navigate('/', { replace: true });
      }
    };
    
    // Écouteur d'erreur pour détecter les problèmes de routage
    window.addEventListener('unhandledrejection', handleRouteError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRouteError);
    };
  }, [location, navigate]);
  
  return null; // Composant sans rendu visuel
}
