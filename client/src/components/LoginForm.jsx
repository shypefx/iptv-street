// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { useIptv } from '../context/IptvContext';
import '../styles/LoginForm.css';

const LoginForm = () => {
  const { login, loading, error } = useIptv();
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation simple
    if (!serverUrl || !username || !password) {
      setFormError('Tous les champs sont obligatoires');
      return;
    }

    try {
      // Assurons-nous que l'URL du serveur est valide
      let url = serverUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }
      
      await login(url, username, password);
    } catch (err) {
      console.error('Login error:', err);
      setFormError(err.message || 'Une erreur s\'est produite lors de la connexion');
    }
  };

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    // Vous pouvez définir des identifiants de démo ici
    setServerUrl('http://demo.server.com');
    setUsername('demo');
    setPassword('demo123');
    
    try {
      await login('http://demo.server.com', 'demo', 'demo123');
    } catch (err) {
      setFormError('La connexion de démonstration n\'est pas disponible pour le moment');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h1>Connexion IPTV</h1>
        <p className="login-description">
          Connectez-vous à votre service IPTV pour accéder à vos chaînes préférées.
        </p>
        
        {(error || formError) && (
          <div className="login-error">
            {formError || error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="server">Serveur IPTV</label>
            <input
              id="server"
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://example.com:8080"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                disabled={loading}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Cacher" : "Afficher"}
              </button>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="login-button" 
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            
            <button 
              type="button" 
              className="demo-button" 
              onClick={handleDemoLogin}
              disabled={loading}
            >
              Démo
            </button>
          </div>
        </form>
        
        <div className="login-help">
          <p>
            Si vous n'avez pas d'identifiants de connexion, contactez votre fournisseur IPTV.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
