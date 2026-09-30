import { ReactNode } from 'react';

import { useEmbedding } from '@/components/providers/embed-provider';
import { cn } from '@/lib/utils';

export const PageHeader = ({
  title,
  description,
  leftContent,
  rightContent,
  className = '',
}: PageHeaderProps) => {
  const { embedState } = useEmbedding();

  if (embedState.hidePageHeader) {
    return null;
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between py-3 px-4 w-full bg-gray-1',
        className,
      )}
    >
      <div className="flex items-center gap-1 grow">
        <div className="grow">
          {typeof title === 'string' ? (
            <h1 className="text-sm font-semibold">{title}</h1>
          ) : (
            title
          )}
          {description && (
            <span className="text-sm text-gray-11">{description}</span>
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
  className?: string;
}
