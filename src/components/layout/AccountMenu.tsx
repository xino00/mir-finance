import { useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../hooks/useSync';

export default function AccountMenu() {
  const { user, loading, signInWithGoogle, signOut, isConfigured, authError, clearAuthError } = useAuth();
  const { status, syncError, lastSync, manualSync } = useSync();
  const [open, setOpen] = useState(false);

  if (!isConfigured) return null;
  if (loading) return null;

  function formatLastSync(date: Date | null): string {
    if (!date) return 'Nunca';
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  function syncStatusLabel(): string {
    if (status === 'syncing') return 'Sincronizando...';
    if (status === 'error') return syncError ?? 'Error de sincronización';
    return `Último sync: ${formatLastSync(lastSync)}`;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => { clearAuthError(); signInWithGoogle(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
        >
          <LogIn size={14} />
          Entrar con Google
        </button>
        {authError && (
          <p className="text-xs text-red-500 max-w-[180px] text-right">{authError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        title={status === 'error' ? (syncError ?? 'Error de sincronización') : 'Cuenta'}
      >
        {status === 'syncing' ? (
          <RefreshCw size={16} className="animate-spin text-primary-500" />
        ) : status === 'error' ? (
          <CloudOff size={16} className="text-red-500" />
        ) : (
          <Cloud size={16} className="text-green-500" />
        )}
        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url as string}
              alt="avatar"
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <User size={12} className="text-primary-600 dark:text-primary-400" />
          )}
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white dark:bg-surface-900 shadow-lg border border-surface-200 dark:border-surface-700 z-40 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
              <p className="text-sm font-medium text-surface-800 dark:text-surface-100 truncate">
                {(user.user_metadata?.full_name as string) || user.email}
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500 truncate">{user.email}</p>
            </div>

            {/* Sync status */}
            <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-surface-600 dark:text-surface-400">
                    Sincronización
                  </p>
                  <p
                    className={`text-xs mt-0.5 truncate ${status === 'error' ? 'text-red-500' : 'text-surface-400'}`}
                    title={status === 'error' ? (syncError ?? undefined) : undefined}
                  >
                    {syncStatusLabel()}
                  </p>
                </div>
                <button
                  onClick={() => { manualSync(); setOpen(false); }}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-primary-500 transition-colors"
                  title="Sincronizar ahora"
                >
                  <RefreshCw size={14} className={status === 'syncing' ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Auth error (while logged in) */}
            {authError && (
              <div className="px-4 py-2 border-b border-surface-100 dark:border-surface-800">
                <p className="text-xs text-red-500">{authError}</p>
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
