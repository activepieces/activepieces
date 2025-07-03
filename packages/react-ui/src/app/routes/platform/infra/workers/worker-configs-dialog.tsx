import { t } from 'i18next';
import { Info } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Props {
  workerProps: Record<string, string>;
}

export const WorkerConfigsModal: React.FC<Props> = ({ workerProps }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Info size={14} />
          {t('Configs')}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('Environment Variables')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(workerProps ?? {}).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-2 rounded-md bg-gray-50 dark:bg-gray-800 border dark:border-gray-700"
            >
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 w-full sm:w-1/3">
                {key}
              </label>
              <Input
                type="text"
                disabled={true}
                value={value as string}
                readOnly
                className="pointer-events-none max-w-[180px] sm:flex-1 p-2 border rounded-md
                    bg-white dark:bg-gray-900
                    text-gray-900 dark:text-gray-100
                    border-gray-300 dark:border-gray-600
                    "
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
