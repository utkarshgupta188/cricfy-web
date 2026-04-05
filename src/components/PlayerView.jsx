import { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';

const PROXY_BASE = 'http://localhost:3001/api/proxy';

function buildProxyUrl(originalUrl, channel) {
  const params = new URLSearchParams({ url: originalUrl });
  if (channel.referer) params.set('referer', channel.referer);
  if (channel.userAgent) params.set('userAgent', channel.userAgent);
  if (channel.cookie) params.set('cookie', channel.cookie);
  // Forward any extra headers from the M3U metadata
  if (channel.headers && typeof channel.headers === 'object') {
    for (const [k, v] of Object.entries(channel.headers)) {
      params.set(k, v);
    }
  }
  return `${PROXY_BASE}?${params.toString()}`;
}

export default function PlayerView({ channel }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const uiRef = useRef(null);
  const [playerError, setPlayerError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      setPlayerError('Your browser does not support Shaka Player.');
      return;
    }

    let destroyed = false;

    const init = async () => {
      setIsLoading(true);
      setPlayerError(null);

      try {
        // Clean up previous instances
        if (uiRef.current) {
          await uiRef.current.destroy();
          uiRef.current = null;
        }
        if (playerRef.current) {
          await playerRef.current.destroy();
          playerRef.current = null;
        }

        if (destroyed) return;

        const video = videoRef.current;
        const player = new shaka.Player();
        await player.attach(video);
        playerRef.current = player;

        // Set up the UI overlay
        const ui = new shaka.ui.Overlay(player, containerRef.current, video);
        uiRef.current = ui;
        ui.configure({
          controlPanelElements: [
            'play_pause',
            'time_and_duration',
            'spacer',
            'mute',
            'volume',
            'fullscreen',
            'overflow_menu',
          ],
          overflowMenuButtons: ['quality', 'playback_rate', 'captions'],
        });

        player.addEventListener('error', (event) => {
          console.error('Shaka player error:', event.detail);
          if (!destroyed) {
            setPlayerError(`Player Error ${event.detail.code}: ${event.detail.message || 'Unknown error'}`);
          }
        });

        // Configure ClearKey DRM
        if (channel.isDrm && channel.licenseString) {
          const drmConfig = parseLicenseString(channel.licenseString, channel);
          console.log('DRM config:', drmConfig, 'license:', channel.licenseString);
          if (drmConfig) {
            if (drmConfig.type === 'clearkeys') {
              // Direct ClearKey: keyid:key pair
              player.configure({
                drm: {
                  clearKeys: drmConfig.clearKeys,
                },
              });
            } else if (drmConfig.type === 'license_server') {
              // ClearKey license server URL — proxy through backend
              const proxyLicenseUrl = buildProxyUrl(drmConfig.serverUrl, channel);
              player.configure({
                drm: {
                  servers: {
                    'org.w3.clearkey': proxyLicenseUrl,
                  },
                },
              });
            }
          }
        }

        // Streaming config
        player.configure({
          streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 2,
            retryParameters: {
              maxAttempts: 4,
              baseDelay: 1000,
              backoffFactor: 2,
              fuzzFactor: 0.5,
            },
          },
          manifest: {
            retryParameters: {
              maxAttempts: 4,
              baseDelay: 1000,
              backoffFactor: 2,
            },
          },
        });

        // NETWORK ENGINE: Proxy all requests via backend with proper URL resolution
        // 
        // Strategy:
        // 1. REQUEST FILTER: Save original URL, then rewrite to proxy URL
        // 2. RESPONSE FILTER: Restore original URL in response so Shaka resolves
        //    relative segment URLs against the real CDN, not our proxy
        const netEngine = player.getNetworkingEngine();

        if (netEngine) {
          // Track original URLs so we can restore them in the response
          const originalUrls = new Map();

          // REQUEST FILTER: Redirect all external URLs through our proxy
          netEngine.registerRequestFilter((type, request, context) => {
            for (let i = 0; i < request.uris.length; i++) {
              const uri = request.uris[i];
              // Only proxy external URLs, skip localhost
              if (uri.includes('localhost')) continue;
              if (uri.startsWith('http://') || uri.startsWith('https://')) {
                const proxyUrl = buildProxyUrl(uri, channel);
                originalUrls.set(proxyUrl, uri);
                request.uris[i] = proxyUrl;
              }
            }
          });

          // RESPONSE FILTER: Tell Shaka the real URI so relative URLs resolve correctly
          netEngine.registerResponseFilter((type, response, context) => {
            if (response.uri && originalUrls.has(response.uri)) {
              response.uri = originalUrls.get(response.uri);
              // Clean up to avoid memory leak (keep last 100 entries)
              if (originalUrls.size > 1000) {
                const keys = [...originalUrls.keys()];
                for (let i = 0; i < keys.length - 100; i++) {
                  originalUrls.delete(keys[i]);
                }
              }
            }
          });
        }

        if (destroyed) return;

        // Load the ORIGINAL stream URL — the request filter proxies it,
        // and the response filter ensures Shaka sees the real CDN URL
        console.log('Loading stream:', channel.url);

        await player.load(channel.url);

        if (!destroyed) {
          video.play().catch(() => { });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Player init error:', err);
        if (!destroyed) {
          const code = err.code || '';
          const msg = err.message || String(err);
          setPlayerError(`Failed to load stream (${code}): ${msg}`);
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      destroyed = true;
      if (playerRef.current) {
        playerRef.current.destroy().catch(() => { });
        playerRef.current = null;
      }
      if (uiRef.current) {
        uiRef.current.destroy().catch(() => { });
        uiRef.current = null;
      }
    };
  }, [channel]);

  return (
    <div className="player-view">
      <div className="player-info">
        <h2>{channel.title}</h2>
        <div className="player-meta">
          {channel.groupTitle && <span className="tag">{channel.groupTitle}</span>}
          {channel.isDrm && <span className="badge badge-drm">ClearKey DRM</span>}
        </div>
      </div>

      <div className="player-container" ref={containerRef}>
        {isLoading && (
          <div className="player-loading">
            <div className="spinner"></div>
            <p>Loading stream...</p>
          </div>
        )}
        {playerError && (
          <div className="player-error">
            <span>❌</span>
            <p>{playerError}</p>
            <button
              className="retry-btn"
              onClick={() => {
                setPlayerError(null);
                setIsLoading(true);
                window.location.reload();
              }}
            >
              Retry
            </button>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className="player-details">
        <h4>Stream Details</h4>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">URL</span>
            <span className="detail-value">{truncateUrl(channel.url)}</span>
          </div>
          {channel.referer && (
            <div className="detail-item">
              <span className="detail-label">Referer</span>
              <span className="detail-value">{channel.referer}</span>
            </div>
          )}
          {channel.isDrm && (
            <div className="detail-item">
              <span className="detail-label">DRM</span>
              <span className="detail-value">ClearKey</span>
            </div>
          )}
          {channel.licenseString && (
            <div className="detail-item">
              <span className="detail-label">License</span>
              <span className="detail-value">{truncateUrl(channel.licenseString)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function base64UrlToHex(base64Url) {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const raw = atob(base64);
  let hex = '';
  for (let i = 0; i < raw.length; i++) {
    hex += raw.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

function parseLicenseString(licenseString, channel) {
  if (!licenseString) return null;

  // Case 1: License server URL (e.g., http://...)
  if (licenseString.startsWith('http')) {
    return {
      type: 'license_server',
      serverUrl: licenseString,
    };
  }

  // Case 2: JSON-based JWK format (used by JioTV+)
  try {
    const rawJson = licenseString.trim();
    if (rawJson.startsWith('{') && rawJson.endsWith('}')) {
      const parsed = JSON.parse(rawJson);
      if (parsed.keys && Array.isArray(parsed.keys)) {
        const clearKeys = {};
        for (const keyObj of parsed.keys) {
          if (keyObj.kid && keyObj.k) {
            const hexKid = base64UrlToHex(keyObj.kid);
            const hexKey = base64UrlToHex(keyObj.k);
            clearKeys[hexKid] = hexKey;
          }
        }
        if (Object.keys(clearKeys).length > 0) {
          return { type: 'clearkeys', clearKeys };
        }
      }
    }
  } catch (e) {
    // Ignore JSON parse errors and fall back to hex pair parsing
  }

  // Case 3: Direct hex key pair — matches Kodi's regex: ^[0-9a-fA-F]+:[0-9a-fA-F]+$
  const hexPairRegex = /^[0-9a-fA-F]+:[0-9a-fA-F]+$/;

  // Try splitting by | first (Kodi DRM format: system|keys|headers)
  const parts = licenseString.split('|').filter((p) => p.trim());
  for (const part of parts) {
    const trimmed = part.trim();
    if (hexPairRegex.test(trimmed)) {
      const [keyId, key] = trimmed.split(':').map((s) => s.trim().toLowerCase());
      return { type: 'clearkeys', clearKeys: { [keyId]: key } };
    }
  }

  // Try direct match without pipe separators
  if (hexPairRegex.test(licenseString.trim())) {
    const [keyId, key] = licenseString.trim().split(':').map((s) => s.trim().toLowerCase());
    return { type: 'clearkeys', clearKeys: { [keyId]: key } };
  }

  console.warn('Unknown license format:', licenseString);
  return null;
}

function truncateUrl(url) {
  if (!url) return '';
  return url.length > 80 ? url.substring(0, 80) + '...' : url;
}
