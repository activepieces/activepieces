import { t } from 'i18next';
import { LucideIcon, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function PreviewIconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={onClick}
          aria-label={label}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function PreviewCard({
  icon: Icon,
  label,
  actions,
  toolbar,
  children,
  renderExpanded,
  className,
  bodyClassName,
}: PreviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={cn(
        'my-3 w-full overflow-hidden rounded-xl border bg-panel',
        className,
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-6 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-gray-11" />
          <span className="truncate text-sm font-medium text-gray-11">
            {label}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {actions}
          {renderExpanded && (
            <PreviewIconButton
              icon={Maximize2}
              label={t('Expand')}
              onClick={() => setExpanded(true)}
            />
          )}
        </div>
      </div>
      {toolbar}
      <div className={cn('overflow-hidden', bodyClassName)}>{children}</div>

      {renderExpanded && (
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent size="xl" className="flex h-[85vh] flex-col gap-3">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className="size-4 text-gray-11" />
                {label}
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-auto">
              {renderExpanded()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}

export type PreviewCardProps = {
  icon: LucideIcon;
  label: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  renderExpanded?: () => React.ReactNode;
  className?: string;
  bodyClassName?: string;
};
