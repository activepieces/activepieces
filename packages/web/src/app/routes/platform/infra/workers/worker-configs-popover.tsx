import { t } from 'i18next';
import { SlidersHorizontal } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const WorkerConfigsPopover: React.FC<Props> = ({ workerProps }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          title={t('Configs')}
        >
          <SlidersHorizontal size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[60vh] overflow-y-auto">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">{t('Environment Variables')}</h4>
          {Object.entries(workerProps ?? {}).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-col gap-1 p-2 rounded-md bg-gray-50 dark:bg-gray-800 border dark:border-gray-700"
            >
              <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                {key}
              </label>
              <Input
                type="text"
                disabled={true}
                value={value as string}
                readOnly
                className="pointer-events-none h-7 text-xs p-1.5 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

type Props = {
  workerProps: Record<string, string>;
};
