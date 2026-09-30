import { SandboxInformation } from '@activepieces/shared';
import { t } from 'i18next';
import { Box } from 'lucide-react';
import prettyBytes from 'pretty-bytes';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const SandboxesPopover: React.FC<Props> = ({ sandboxes }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-gray-11"
          title={t('Sandboxes')}
        >
          <Box />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {sandboxes.length === 0 ? (
          <p className="p-4 text-sm text-gray-11">
            {t('No sandboxes running')}
          </p>
        ) : (
          <table className="text-sm">
            <thead>
              <tr className="border-b border-gray-6">
                <th className="px-4 py-3 text-left font-medium text-gray-11">
                  {t('Sandbox')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-11">
                  {t('Status')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-11">
                  {t('Memory')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sandboxes.map((sandbox) => (
                <tr
                  key={sandbox.sandboxId}
                  className="border-b border-gray-6 last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono font-medium">
                    {t('Box')} #{sandbox.boxId}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={sandbox.busy ? 'info' : 'secondary'}>
                      {sandbox.busy ? t('Busy') : t('Idle')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-11 tabular-nums">
                    {prettyBytes(sandbox.memoryUsageBytes, { binary: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PopoverContent>
    </Popover>
  );
};

type Props = {
  sandboxes: SandboxInformation[];
};
