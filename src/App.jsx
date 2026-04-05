import { useState, useEffect } from 'react';
import ProviderList from './components/ProviderList';
import ChannelList from './components/ChannelList';
import PlayerView from './components/PlayerView';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [apiUrl, setApiUrl] = useState(null);
  const [providers, setProviders] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [view, setView] = useState('providers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProviderTitle, setSelectedProviderTitle] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/config`);
      const data = await res.json();
      if (data.apiUrl) {
        setApiUrl(data.apiUrl);
        await fetchProviders(data.apiUrl);
      } else {
        setError('Could not fetch API configuration');
      }
    } catch (e) {
      setError('Connection failed. Make sure the backend server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProviders(url) {
    try {
      const res = await fetch(`${API_BASE}/providers?apiUrl=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProviders(data);
      } else {
        setError('Invalid provider data received');
      }
    } catch (e) {
      setError('Failed to load providers');
    }
  }

  async function handleProviderClick(provider) {
    try {
      setLoading(true);
      setError(null);
      setSelectedProviderTitle(provider.title || 'Unknown');
      const res = await fetch(
        `${API_BASE}/channels?providerUrl=${encodeURIComponent(provider.catLink)}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setChannels(data);
        setView('channels');
      } else {
        setError('No channels found');
      }
    } catch (e) {
      setError('Failed to load channels');
    } finally {
      setLoading(false);
    }
  }

  function handleChannelClick(channel) {
    setSelectedChannel(channel);
    setView('player');
  }

  function handleBack() {
    if (view === 'player') {
      setSelectedChannel(null);
      setView('channels');
    } else if (view === 'channels') {
      setChannels([]);
      setView('providers');
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          {view !== 'providers' && (
            <button className="back-btn" onClick={handleBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="logo">
            <span className="logo-icon">📺</span>
            <h1>CricfyTV</h1>
          </div>
        </div>
        <div className="header-right">
          <span className="badge">
            {view === 'providers' ? `${providers.length} Providers` :
             view === 'channels' ? `${channels.length} Channels` :
             'Now Playing'}
          </span>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <p>{error}</p>
            <button onClick={() => { setError(null); fetchConfig(); }}>Retry</button>
          </div>
        )}

        {loading && view !== 'player' ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {view === 'providers' && (
              <ProviderList providers={providers} onSelect={handleProviderClick} />
            )}
            {view === 'channels' && (
              <ChannelList
                channels={channels}
                providerTitle={selectedProviderTitle}
                onSelect={handleChannelClick}
              />
            )}
            {view === 'player' && selectedChannel && (
              <PlayerView channel={selectedChannel} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
