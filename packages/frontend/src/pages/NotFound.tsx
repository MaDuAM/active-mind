import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-secondary)] px-4">
      <h1 className="text-6xl font-bold text-gold-500 mb-4">404</h1>
      <p className="text-xl text-[var(--text-secondary)] mb-2">Page not found</p>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary">
        ← Back to Dashboard
      </Link>
    </div>
  );
}