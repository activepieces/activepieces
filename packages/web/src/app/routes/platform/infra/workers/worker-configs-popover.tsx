import { WorkerProps } from '@activepieces/shared';
import { PreferenceHorizontalIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
          size="icon"
          className="size-7 text-gray-11 hover:text-gray-12"
          title={t('Configs')}
        >
          <HugeiconsIcon icon={PreferenceHorizontalIcon} size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <table className="text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium text-gray-11">
                {t('Variable')}
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-11">
                {t('Value')}
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-mono font-medium">{key}</td>
                <td className="px-3 py-2 font-mono text-gray-11">{value}</td>
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
