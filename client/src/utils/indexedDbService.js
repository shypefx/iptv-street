// src/utils/indexedDbService.js
const DB_NAME = 'xtremeIptvDb';
const DB_VERSION = 1;
const CHANNELS_STORE = 'channels';
const METADATA_STORE = 'metadata';

let db = null;

const initDb = () => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Créer le store pour les chaînes
      if (!db.objectStoreNames.contains(CHANNELS_STORE)) {
        db.createObjectStore(CHANNELS_STORE, { keyPath: 'id' });
      }
      
      // Créer le store pour les métadonnées
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Sauvegarder les chaînes dans IndexedDB
export const saveChannels = async (channels, serverUrl, username, password) => {
  try {
    const db = await initDb();
    const transaction = db.transaction([CHANNELS_STORE, METADATA_STORE], 'readwrite');
    const channelStore = transaction.objectStore(CHANNELS_STORE);
    const metadataStore = transaction.objectStore(METADATA_STORE);
    
    // Vider les stores existants
    channelStore.clear();
    
    // Ajouter chaque chaîne
    for (const channel of channels) {
      channelStore.add(channel);
    }
    
    // Sauvegarder les métadonnées
    metadataStore.put({
      key: 'credentials',
      serverUrl,
      username,
      password,
      timestamp: Date.now()
    });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    throw error;
  }
};

// Récupérer les chaînes depuis IndexedDB
export const getChannels = async () => {
  try {
    const db = await initDb();
    const transaction = db.transaction([CHANNELS_STORE], 'readonly');
    const store = transaction.objectStore(CHANNELS_STORE);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error getting channels from IndexedDB:', error);
    throw error;
  }
};

// Récupérer les métadonnées
export const getMetadata = async (key) => {
  try {
    const db = await initDb();
    const transaction = db.transaction([METADATA_STORE], 'readonly');
    const store = transaction.objectStore(METADATA_STORE);
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error(`Error getting metadata '${key}' from IndexedDB:`, error);
    throw error;
  }
};

// Vérifier si des données valides existent
export const checkValidCache = async (serverUrl, username, password, validityDuration) => {
  try {
    const credentials = await getMetadata('credentials');
    
    if (!credentials) return null;
    
    const now = Date.now();
    
    // Vérifier la validité du cache
    if (now - credentials.timestamp > validityDuration) {
      console.log('Cache expired, needs refresh');
      return null;
    }
    
    // Vérifier si les identifiants correspondent
    if (
      credentials.serverUrl !== serverUrl ||
      credentials.username !== username ||
      credentials.password !== password
    ) {
      console.log('Credentials changed, need to refresh cache');
      return null;
    }
    
    // Récupérer les chaînes
    const channels = await getChannels();
    console.log(`Successfully loaded ${channels.length} channels from IndexedDB cache`);
    return channels;
  } catch (error) {
    console.error('Error checking cache in IndexedDB:', error);
    return null;
  }
};

// Vider le cache
export const clearIdbCache = async () => {
  try {
    const db = await initDb();
    const transaction = db.transaction([CHANNELS_STORE, METADATA_STORE], 'readwrite');
    transaction.objectStore(CHANNELS_STORE).clear();
    transaction.objectStore(METADATA_STORE).clear();
    
    return new Promise((resolve) => {
      transaction.oncomplete = () => {
        console.log('IndexedDB cache cleared');
        resolve(true);
      };
    });
  } catch (error) {
    console.error('Error clearing IndexedDB cache:', error);
    throw error;
  }
};
