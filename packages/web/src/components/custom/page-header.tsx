import { ReactNode } from 'react';

import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { useEmbedding } from '@/components/providers/embed-provider';
import { cn } from '@/lib/utils';

export const PageHeader = ({
  title,
  description,
  leftContent,
  rightContent,
  showSidebarToggle = false,
  className = '',
}: PageHeaderProps) => {
  const { embedState } = useEmbedding();

  if (embedState.hidePageHeader) {
    return null;
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between py-3 px-4 w-full bg-background',
        className,
      )}
    >
      <div className="flex items-center gap-1 grow">
        {showSidebarToggle && <ApSidebarToggle />}
        <div className="grow">
          {typeof title === 'string' ? (
            <h1 className="text-base font-semibold">{title}</h1>
          ) : (
            title
          )}
          {description && (
            <span className="text-sm text-muted-foreground">{description}</span>
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
  showSidebarToggle?: boolean;
  className?: string;
}
