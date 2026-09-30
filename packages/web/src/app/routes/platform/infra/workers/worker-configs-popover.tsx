import { WorkerProps } from '@activepieces/shared';
import { t } from 'i18next';
import { SlidersHorizontal } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const WorkerConfigsPopover: React.FC<Props> = ({ workerProps }) => {
  const entries = Object.entries(workerProps ?? {});

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-gray-11"
          title={t('Configs')}
        >
          <SlidersHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <table className="text-sm">
          <thead>
            <tr className="border-b border-gray-6">
              <th className="px-4 py-3 text-left font-medium text-gray-11">
                {t('Variable')}
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-11">
                {t('Value')}
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} className="border-b border-gray-6 last:border-b-0">
                <td className="px-4 py-3 font-mono font-medium">{key}</td>
                <td className="px-4 py-3 font-mono text-gray-11">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PopoverContent>
    </Popover>
  );
};

type Props = {
  workerProps: WorkerProps;
};
