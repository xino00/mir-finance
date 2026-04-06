import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export default function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-4 lg:p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
