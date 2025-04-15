// src/pages/Profile.jsx
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/Profile.css'; // Create this CSS file for styling

const Profile = () => {
  const { currentUser, getUserPlaylists, savePlaylist, deletePlaylist, error } = useContext(AuthContext);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const userPlaylists = await getUserPlaylists();
      setPlaylists(userPlaylists);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistUrl) return;

    try {
      await savePlaylist(newPlaylistUrl);
      loadPlaylists();
      setNewPlaylistUrl('');
    } catch (err) {
      console.error('Failed to add playlist:', err);
    }
  };

  const handleDeletePlaylist = async (playlistUrl) => {
    try {
      await deletePlaylist(playlistUrl);
      loadPlaylists();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  if (!currentUser) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-container">
      <div className='box'></div>
      <div className="profile-header">
        <h1>User Profile</h1>
        <div className="user-info">
          <p><strong>Username:</strong> {currentUser.username}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
        </div>
      </div>

      <div className="playlists-section">
        <h2>My IPTV Playlists</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleAddPlaylist} className="add-playlist-form">
          <input
            type="text"
            placeholder="Enter Xtream Codes playlist URL"
            value={newPlaylistUrl}
            onChange={(e) => setNewPlaylistUrl(e.target.value)}
          />
          <button type="submit">Add Playlist</button>
        </form>

        {loading ? (
          <div>Loading playlists...</div>
        ) : (
          <div className="playlists-list">
            {playlists.length === 0 ? (
              <p>You don't have any saved playlists yet.</p>
            ) : (
              <ul>
                {playlists.map((playlist, index) => (
                  <li key={index} className="playlist-item">
                    <span className="playlist-url">{playlist}</span>
                    <button 
                      onClick={() => handleDeletePlaylist(playlist)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
