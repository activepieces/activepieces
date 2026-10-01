import { t } from 'i18next';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

import { Button } from '@/components/ui/button';

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
  return (
    <AnimatePresence>
      {selectedRows.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-2xl bg-panel p-2 shadow-over">
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {action.render(selectedRows, resetSelection)}
              </React.Fragment>
            ))}
            <div className="mx-1 h-6 w-px bg-gray-6" />
            <span className="text-sm text-gray-11">
              {t('{count} selected', { count: selectedRows.length })}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={resetSelection}>
              <X />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
