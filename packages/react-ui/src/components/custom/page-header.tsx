import { ReactNode } from 'react';

import { useEmbedding } from '@/components/embed-provider';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar-shadcn';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  showBorder?: boolean;
  className?: string;
  hideSidebarTrigger?: boolean;
}

export const PageHeader = ({
  title,
  description,
  leftContent,
  rightContent,
  showBorder = false,
  className = '',
  hideSidebarTrigger = false,
}: PageHeaderProps) => {
  const { embedState } = useEmbedding();

  if (embedState.hidePageHeader) {
    return null;
  }

  const showSidebarTrigger = !hideSidebarTrigger && !embedState.isEmbedded;

  return (
    <div
      className={`flex items-center justify-between py-3 w-full px-4 ${
        showBorder ? 'border-b' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {showSidebarTrigger && <SidebarTrigger />}
          {showSidebarTrigger && (
            <Separator orientation="vertical" className="h-5 mr-2" />
          )}

          <div>
            <div className="flex items-center gap-2">
              {typeof title === 'string' ? (
                <h1 className="text-base font-normal">{title}</h1>
              ) : (
                title
              )}
            </div>
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>

          {leftContent}
        </div>

        {rightContent}
      </div>
    </div>
  );
};
