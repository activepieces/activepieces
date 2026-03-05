import { ReactNode } from 'react';

import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { useEmbedding } from '@/components/providers/embed-provider';
export const PageHeader = ({
  title,
  description,
  leftContent,
  rightContent,
  showBorder = false,
  showSidebarToggle = false,
  className = '',
}: PageHeaderProps) => {
  const { embedState } = useEmbedding();

  if (embedState.hidePageHeader) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-between py-3 w-full ${
        showBorder ? 'border-b' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-1">
        {showSidebarToggle && <ApSidebarToggle />}
        <div>
          {typeof title === 'string' ? (
            <h1 className="text-sm font-medium">{title}</h1>
          ) : (
            title
          )}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
        {leftContent}
      </div>
      {rightContent}
    </div>
  );
};

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  showBorder?: boolean;
  showSidebarToggle?: boolean;
  className?: string;
}
