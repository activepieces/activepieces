import { t } from 'i18next';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { useStageDockTarget } from '@/hooks/use-stage-scroll-container';
import { cn } from '@/lib/utils';

interface DataTableBulkActionsProps<TData> {
  selectedRows: TData[];
  actions: Array<{
    render: (
      selectedRows: TData[],
      resetSelection: () => void,
    ) => React.ReactNode;
  }>;
  resetSelection: () => void;
}

export function DataTableBulkActions<TData>({
  selectedRows,
  actions,
  resetSelection,
}: DataTableBulkActionsProps<TData>) {
  const stageContainer = useStageDockTarget();

  const bar = (
    <div
      className={cn(
        'bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none',
        stageContainer ? 'absolute' : 'fixed',
      )}
    >
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="pointer-events-auto max-w-full"
          >
            <div className="flex flex-wrap items-center justify-center gap-3 bg-background border rounded-lg shadow-lg p-2">
              {actions.map((action, index) => (
                <React.Fragment key={index}>
                  {action.render(selectedRows, resetSelection)}
                </React.Fragment>
              ))}
              <div className="border-l h-6 mx-1" />
              <span className="text-sm text-muted-foreground">
                {t('{count} selected', { count: selectedRows.length })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={resetSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return stageContainer ? createPortal(bar, stageContainer) : bar;
}
