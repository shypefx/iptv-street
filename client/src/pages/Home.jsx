// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIptv } from '../context/IptvContext.jsx';
import XtremeCodeLoader from '../components/XtremeCodeLoader';
import { RiLiveLine } from 'react-icons/ri';
import { BsCalendar3, BsStarFill } from 'react-icons/bs';
import '../styles/Home.css';

export default function Home() {
  const { isAuthenticated, loading } = useIptv();
  const [loadingComplete, setLoadingComplete] = useState(false);
  const navigate = useNavigate();

  // Rediriger vers la page de visionnage si l'utilisateur est authentifié
  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié et que les données sont chargées
    if (isAuthenticated && !loading && loadingComplete) {
      // Redirection automatique vers la page de visionnage
      navigate('/watch');
    }
  }, [isAuthenticated, loading, loadingComplete, navigate]);

  // Gérer le succès de la connexion
  const handleLoginSuccess = () => {
    console.log("Connexion réussie, redirection vers la page de visionnage...");
    // Marquer le chargement comme terminé pour déclencher la redirection
    setLoadingComplete(true);
  };

  return (
    <div className="home-container">
      {/* En-tête de page */}
      <header className="home-header">
        <h1>IPTV <span className="accent">Player</span></h1>
      </header>

      {/* Contenu principal */}
      <main className="home-content">
        <div className="onboarding-section">
          <div className="onboarding-content">
            <div className="welcome-message">
              <h2>Bienvenue sur votre IPTV Player</h2>
              <p>Pour commencer, connectez-vous à votre fournisseur IPTV</p>
            </div>
            
            <div className="onboarding-card">
              <h3>Se connecter avec Xtream Codes</h3>
              {loading ? (
                <div className="loading-connection">
                  <div className="loading-spinner"></div>
                  <p>Connexion en cours...</p>
                </div>
              ) : (
                <XtremeCodeLoader onSuccess={handleLoginSuccess} />
              )}
            </div>
            
            <div className="feature-list">
              <div className="feature">
                <RiLiveLine className="feature-icon" />
                <h4>Chaînes TV en direct</h4>
                <p>Regardez vos chaînes préférées en direct en haute qualité</p>
              </div>
              <div className="feature">
                <BsCalendar3 className="feature-icon" />
                <h4>Guide des programmes</h4>
                <p>Consultez le programme TV pour planifier votre visionnage</p>
              </div>
              <div className="feature">
                <BsStarFill className="feature-icon" />
                <h4>Films et séries à la demande</h4>
                <p>Accédez à une vaste bibliothèque de contenus à la demande</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="home-footer">
        <p>IPTV Player &copy; {new Date().getFullYear()} - Application personnelle de streaming TV</p>
      </footer>
    </div>
  );
}
