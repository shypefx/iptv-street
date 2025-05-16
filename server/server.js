// server/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const url = require('url');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();

// Increase JSON payload limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware
app.use(cors());
app.use(express.json()); // For parsing JSON request bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  playlists: [{ type: String }], // Array of playlist URLs
  isAdmin: { type: Boolean, default: false }, // Add this line
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);


const channelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  serverUrl: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  channels: {
    type: Array,
    default: []
  },
  categories: {
    type: Array,
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isFrenchOnly: {
    type: Boolean,
    default: true
  }
});

const Channel = mongoose.model('Channel', channelSchema);


// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// AUTH ROUTES

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save a playlist to user account
app.post('/api/user/playlists', authenticateToken, async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    
    if (!playlistUrl) {
      return res.status(400).json({ message: 'Playlist URL is required' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add playlist if it doesn't already exist
    if (!user.playlists.includes(playlistUrl)) {
      user.playlists.push(playlistUrl);
      await user.save();
    }
    
    res.json({ message: 'Playlist saved successfully', playlists: user.playlists });
  } catch (error) {
    console.error('Save playlist error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's saved playlists
app.get('/api/user/playlists', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ playlists: user.playlists });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a playlist
app.delete('/api/user/playlists', authenticateToken, async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    
    if (!playlistUrl) {
      return res.status(400).json({ message: 'Playlist URL is required' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.playlists = user.playlists.filter(url => url !== playlistUrl);
    await user.save();
    
    res.json({ message: 'Playlist removed successfully', playlists: user.playlists });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// IPTV PROXY ROUTE (Your existing code)
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

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Proxy server is running correctly!' });
});

app.post('/api/iptv/channels', authenticateToken, async (req, res) => {
  try {
    const { serverUrl, username, channels, categories } = req.body;
    
    if (!serverUrl || !username || !channels || !Array.isArray(channels)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }
    
    // Find existing channel document or create new one
    let channelDoc = await Channel.findOne({ 
      userId: req.user.id,
      serverUrl,
      username
    });
    
    if (channelDoc) {
      // Update existing document
      channelDoc.channels = channels;
      channelDoc.categories = categories || [];
      channelDoc.lastUpdated = new Date();
      await channelDoc.save();
    } else {
      // Create new document
      channelDoc = new Channel({
        userId: req.user.id,
        serverUrl,
        username,
        channels,
        categories: categories || [],
        lastUpdated: new Date()
      });
      await channelDoc.save();
    }
    
    res.json({ 
      message: 'Channels saved successfully',
      lastUpdated: channelDoc.lastUpdated,
      channelCount: channels.length
    });
  } catch (error) {
    console.error('Save IPTV channels error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get IPTV channels from database
app.get('/api/iptv/channels', authenticateToken, async (req, res) => {
  try {
    const { serverUrl, username } = req.query;
    
    if (!serverUrl || !username) {
      return res.status(400).json({ message: 'Server URL and username are required' });
    }
    
    const channelDoc = await Channel.findOne({ 
      userId: req.user.id,
      serverUrl,
      username
    });
    
    if (!channelDoc) {
      return res.status(404).json({ message: 'No channels found for this configuration' });
    }
    
    // Check if data is too old (more than 24 hours)
    const lastUpdated = new Date(channelDoc.lastUpdated);
    const now = new Date();
    const ageInHours = (now - lastUpdated) / (1000 * 60 * 60);
    
    res.json({
      channels: channelDoc.channels,
      categories: channelDoc.categories,
      lastUpdated: channelDoc.lastUpdated,
      needsRefresh: ageInHours > 24, // Recommend refresh if older than 24h
      channelCount: channelDoc.channels.length
    });
  } catch (error) {
    console.error('Get IPTV channels error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if channels exist for a specific configuration
app.get('/api/iptv/channels/check', authenticateToken, async (req, res) => {
  try {
    const { serverUrl, username } = req.query;
    
    if (!serverUrl || !username) {
      return res.status(400).json({ message: 'Server URL and username are required' });
    }
    
    const channelDoc = await Channel.findOne({ 
      userId: req.user.id,
      serverUrl,
      username
    });
    
    if (!channelDoc) {
      return res.json({ exists: false });
    }
    
    const lastUpdated = new Date(channelDoc.lastUpdated);
    const now = new Date();
    const ageInHours = (now - lastUpdated) / (1000 * 60 * 60);
    
    res.json({
      exists: true,
      lastUpdated: channelDoc.lastUpdated,
      channelCount: channelDoc.channels.length,
      needsRefresh: ageInHours > 24
    });
  } catch (error) {
    console.error('Check IPTV channels error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete channel cache
app.delete('/api/iptv/channels', authenticateToken, async (req, res) => {
  try {
    const { serverUrl, username } = req.body;
    
    if (!serverUrl || !username) {
      return res.status(400).json({ message: 'Server URL and username are required' });
    }
    
    const result = await Channel.deleteOne({ 
      userId: req.user.id,
      serverUrl,
      username
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No channels found for this configuration' });
    }
    
    res.json({ message: 'Channel cache deleted successfully' });
  } catch (error) {
    console.error('Delete IPTV channels error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark user as an admin
app.post('/api/user/admin', authenticateToken, async (req, res) => {
  try {
    const { targetUserId, isAdmin } = req.body;
    
    // Check if current user is already an admin (you might want to add this field to your User schema)
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    
    // Update target user
    const user = await User.findByIdAndUpdate(
      targetUserId, 
      { isAdmin: Boolean(isAdmin) }, 
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: `User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`,
      user: {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Admin status update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// In production, serve the React/Vue.js app
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
});

