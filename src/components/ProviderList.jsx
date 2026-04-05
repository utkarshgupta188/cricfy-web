export default function ProviderList({ providers, onSelect }) {
  return (
    <div className="provider-list">
      <h2 className="section-title">Choose a Provider</h2>
      <div className="grid">
        {providers
          .filter((p) => p.catLink && p.catLink.startsWith('http'))
          .map((provider, i) => (
            <div
              key={i}
              className="card provider-card"
              onClick={() => onSelect(provider)}
            >
              <div className="card-image">
                <img
                  src={provider.image || 'https://placehold.co/120x120/1a1a2e/e94560?text=TV'}
                  alt={provider.title}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/120x120/1a1a2e/e94560?text=TV';
                  }}
                />
              </div>
              <div className="card-body">
                <h3>{provider.title || 'Unknown Provider'}</h3>
              </div>
            </div>
          ))}
      </div>
      {providers.length === 0 && (
        <div className="empty-state">
          <p>No providers available</p>
        </div>
      )}
    </div>
  );
}
