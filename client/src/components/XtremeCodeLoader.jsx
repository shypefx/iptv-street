// src/components/XtremeCodeLoader.jsx - Version mise à jour
import React, { useState, useEffect } from 'react';
import { useIptv } from '../context/IPTVContext';
import '../styles/XtremeCodeLoader.css';

const XtremeCodeLoader = ({ onSuccess }) => {
  // Obtenir les fonctions et états nécessaires du contexte IPTV
  const { 
    channels, 
    loading, 
    error, 
    isAuthenticated, 
    login, 
    logout, 
    handleClearCache 
  } = useIptv();
  
  // États locaux pour le formulaire
  const [formData, setFormData] = useState({
    serverUrl: '',
    username: '',
    password: ''
  });

  // État local pour gérer les messages d'erreur/succès spécifiques au formulaire
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer les informations d'authentification sauvegardées
  useEffect(() => {
    const savedAuth = localStorage.getItem('iptv_auth');
    if (savedAuth) {
      try {
        const { serverUrl, username, password } = JSON.parse(savedAuth);
        setFormData({ serverUrl, username, password });
      } catch (e) {
        console.error("Erreur lors de la récupération des informations d'authentification:", e);
      }
    }
  }, []);

  // Gestion des changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      // Vérification des champs vides
      if (!formData.serverUrl || !formData.username || !formData.password) {
        setFormError('Tous les champs sont obligatoires');
        return;
      }

      // Appel à la fonction de connexion du contexte
      await login(formData.serverUrl, formData.username, formData.password);
      
      // Sauvegarder les informations d'authentification
      localStorage.setItem('iptv_auth', JSON.stringify(formData));
      
      setFormSuccess('Connexion réussie!');
      
      // Appeler la fonction de callback en cas de succès
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      setFormError(err.message || "Erreur de connexion. Vérifiez vos informations et réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="xtreme-code-container">
      {/* Barre d'en-tête avec formulaire de connexion */}
      <div className="xtreme-header">
        {isAuthenticated ? (
          <div className="header-connected">
            <div className="header-info">
              <h3 className="header-title">IPTV Player ({channels.length} chaînes)</h3>
              <div className="header-subtitle">{formData.serverUrl} - {formData.username}</div>
            </div>
            <div className="header-actions">
              <button 
                onClick={handleClearCache} 
                className="clear-cache-button"
              >
                Vider le cache
              </button>
              <button 
                onClick={logout} 
                className="logout-button"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="text"
              name="serverUrl"
              value={formData.serverUrl}
              onChange={handleChange}
              placeholder="URL du serveur"
              required
              className="form-input"
              disabled={isSubmitting}
            />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nom d'utilisateur"
              required
              className="form-input"
              disabled={isSubmitting}
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mot de passe"
              required
              className="form-input"
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              disabled={isSubmitting || loading} 
              className={`form-button ${isSubmitting || loading ? 'button-disabled' : ''}`}
            >
              {isSubmitting || loading ? 'Connexion...' : 'Connecter'}
            </button>
          </form>
        )}
        
        {(error || formError) && (
          <div className="error-message">
            {formError || error}
          </div>
        )}
        
        {formSuccess && (
          <div className="success-message">
            {formSuccess}
          </div>
        )}
      </div>
      
      {/* Suppression des parties VirtualizedChannelList et VideoPlayer */}
      {/* car ces fonctionnalités ont été déplacées vers la page d'accueil */}
      
      {/* Overlay de chargement */}
      {(loading || isSubmitting) && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default XtremeCodeLoader;
