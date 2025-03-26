// server/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const url = require('url');

const app = express();

// Activer CORS pour le développement
app.use(cors());

// Middleware pour journaliser les requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route de proxy pour les services IPTV
app.use('/api/iptv-proxy', (req, res, next) => {
  const targetUrl = req.query.target;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL parameter' });
  }
  
  console.log('Target URL requested:', targetUrl);
  
  try {
    const decodedUrl = decodeURIComponent(targetUrl);
    console.log('Decoded URL:', decodedUrl);
    
    // Extraire la partie base de l'URL (sans les paramètres)
    const parsedUrl = url.parse(decodedUrl);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    
    console.log('Base URL for proxy:', baseUrl);
    console.log('Path and query:', parsedUrl.path);
    
    // Créer un proxy middleware pour cette requête
    const proxy = createProxyMiddleware({
      target: baseUrl,
      changeOrigin: true,
      pathRewrite: (path) => {
        // Retourner seulement le chemin et les paramètres de l'URL décodée
        return parsedUrl.path;
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying request to:', baseUrl + parsedUrl.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Ajouter les headers CORS à la réponse
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
        
        console.log('Proxy response status:', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Proxy Error', message: err.message });
      }
    });
    
    return proxy(req, res, next);
  } catch (error) {
    console.error('Error processing proxy request:', error);
    return res.status(500).json({ error: 'Proxy Configuration Error', message: error.message });
  }
});

// Route de test simple pour vérifier que le serveur fonctionne
app.get('/api/test', (req, res) => {
  res.json({ message: 'Proxy server is running correctly!' });
});

// En production, servir l'application React compilée
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Access your app at http://localhost:${PORT}`);
  console.log(`Test the proxy at http://localhost:${PORT}/api/test`);
});
