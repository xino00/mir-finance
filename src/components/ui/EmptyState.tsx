import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-surface-300 dark:text-surface-600 mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">{title}</h3>
      <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}
