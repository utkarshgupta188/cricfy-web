import { useState, useMemo } from 'react';

export default function ChannelList({ channels, providerTitle, onSelect }) {
  const [filter, setFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  const groups = useMemo(() => {
    const g = new Set();
    channels.forEach((ch) => {
      if (ch.groupTitle) g.add(ch.groupTitle);
    });
    return ['all', ...Array.from(g).sort()];
  }, [channels]);

  const filtered = useMemo(() => {
    return channels.filter((ch) => {
      const matchName = ch.title.toLowerCase().includes(filter.toLowerCase());
      const matchGroup = groupFilter === 'all' || ch.groupTitle === groupFilter;
      return matchName && matchGroup;
    });
  }, [channels, filter, groupFilter]);

  return (
    <div className="channel-list">
      <h2 className="section-title">{providerTitle} Channels</h2>

      <div className="filters animate-fade-in">
        <div className="search-box glass-premium">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search channels..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="genre-ribbon-container animate-fade-in">
        <div className="genre-ribbon">
          {groups.map((g) => (
            <button
              key={g}
              className={`genre-tab glass-premium ${groupFilter === g ? 'active' : ''}`}
              onClick={() => setGroupFilter(g)}
            >
              {g === 'all' ? 'All Channels' : g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid channels-grid animated-grid">
        {filtered.map((ch, i) => (
          <div
            key={i}
            className={`channel-card glass-premium magnetic-card animate-fade-in ${ch.isDrm ? 'drm-exclusive' : ''}`}
            onClick={() => onSelect(ch)}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="card-status-bar">
              {ch.isDrm && <span className="mini-badge drm">DRM</span>}
              <span className="mini-badge live">LIVE</span>
            </div>

            <div className="logo-container-large">
              {ch.tvgLogo ? (
                <img
                  className="main-logo"
                  src={ch.tvgLogo}
                  alt={ch.title}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="logo-fallback" style={{ display: ch.tvgLogo ? 'none' : 'flex' }}>
                {ch.title.charAt(0)}
              </div>
              
              <div className="hover-play-overlay">
                <div className="play-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="channel-info-minimal">
              <h3 className="channel-name-premium">{ch.title}</h3>
              {ch.groupTitle && (
                <span className="channel-category-dim">
                  {ch.groupTitle}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No channels match your search</p>
        </div>
      )}
    </div>
  );
}
