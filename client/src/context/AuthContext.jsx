// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user profile using stored token
  const fetchUserProfile = async (token) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get('http://100.100.56.60:5173/api/user/profile', config);
      setCurrentUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setError('Session expired. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await axios.post('http://100.100.56.60:5173/api/auth/login', { username, password });
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      setError(null);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('http://100.100.56.60:5173/api/auth/register', { 
        username, email, password 
      });
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      setError(null);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  // Save playlist
  const savePlaylist = async (playlistUrl) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.post('http://100.100.56.60:5173/api/user/playlists', { playlistUrl }, config);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save playlist');
      throw error;
    }
  };

  // Get playlists
  const getPlaylists = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get('http://100.100.56.60:5173/api/user/playlists', config);
      return response.data.playlists;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to get playlists');
      throw error;
    }
  };

  // Delete playlist
  const deletePlaylist = async (playlistUrl) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.delete('http://100.100.56.60:5173/api/user/playlists', { 
        headers: config.headers,
        data: { playlistUrl }
      });
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete playlist');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      error, 
      login, 
      register, 
      logout, 
      savePlaylist,
      getPlaylists,
      deletePlaylist
    }}>
      {children}
    </AuthContext.Provider>
  );
};
