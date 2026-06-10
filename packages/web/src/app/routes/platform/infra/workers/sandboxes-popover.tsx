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
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          title={t('Sandboxes')}
        >
          <Box size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {sandboxes.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            {t('No sandboxes running')}
          </p>
        ) : (
          <table className="text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {t('Sandbox')}
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {t('Status')}
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {t('Memory')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sandboxes.map((sandbox) => (
                <tr
                  key={sandbox.sandboxId}
                  className="border-b last:border-b-0"
                >
                  <td className="px-3 py-2 font-mono font-medium">
                    {t('Box')} #{sandbox.boxId}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={sandbox.busy ? 'accent' : 'secondary'}>
                      {sandbox.busy ? t('Busy') : t('Idle')}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
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
