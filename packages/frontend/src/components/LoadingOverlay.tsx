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
          ? 'fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm' 
          : 'py-12'
      }`}
    >
      <div className="bg-[var(--bg-card)] rounded-card shadow-dropdown p-6 flex flex-col items-center gap-4 border border-[var(--border-color)] min-w-[200px]">
        <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
        {message && (
          <p className="text-sm text-[var(--text-secondary)] animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}