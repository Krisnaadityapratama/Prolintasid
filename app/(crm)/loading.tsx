export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-label="Memuat halaman" aria-busy="true">
      <span className="sr-only">Memuat halaman</span>
      <div className="loading-heading">
        <span className="skeleton-block skeleton-eyebrow" />
        <span className="skeleton-block skeleton-title" />
        <span className="skeleton-block skeleton-description" />
      </div>
      <div className="skeleton-metrics">
        {[1, 2, 3, 4].map((item) => <span className="skeleton-block" key={item} />)}
      </div>
      <div className="skeleton-panel">
        {[1, 2, 3, 4, 5].map((item) => <span className="skeleton-block skeleton-row" key={item} />)}
      </div>
    </div>
  );
}
