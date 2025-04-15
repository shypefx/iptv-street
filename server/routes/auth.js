// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route d'inscription
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    // Optionnel : vous pouvez aussi ajouter des validations supplémentaires ici.
    const user = new User({ username, password, role });
    await user.save();
    return res.status(201).json({ message: 'Utilisateur créé avec succès', user });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'inscription', error });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }
    
    // Pour simplifier, nous ne générons pas de token ici, mais en production, utilisez un JWT
    return res.status(200).json({ message: 'Connexion réussie', user });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({ message: 'Erreur lors de la connexion', error });
  }
});

module.exports = router;
