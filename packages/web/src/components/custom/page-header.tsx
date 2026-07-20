import { t } from 'i18next';
import { Menu } from 'lucide-react';
import { ReactNode } from 'react';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
        {showSidebarToggle && <CollapsedSidebarToggle />}
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

export function CollapsedSidebarToggle() {
  const { open, isHoverExpanded, setOpen, setHovered } = useSidebar();
  const pinnedOpen = open && !isHoverExpanded;
  if (pinnedOpen) {
    return null;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          onMouseEnter={() => setHovered(true)}
        >
          <Menu size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{t('Open Sidebar')}</TooltipContent>
    </Tooltip>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  showSidebarToggle?: boolean;
  className?: string;
}
