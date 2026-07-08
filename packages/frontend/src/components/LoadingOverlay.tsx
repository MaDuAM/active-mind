// frontend/src/components/LoadingOverlay.tsx

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ 
  message, 
  fullScreen = true 
}: LoadingOverlayProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen 
          ? 'fixed inset-0 z-[9999] bg-[var(--bg-secondary)]/80 backdrop-blur-sm' 
          : 'py-12'
      }`}
    >
      <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      {message && (
        <p className="text-sm text-[var(--text-secondary)] animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}