import { FilePlus, RefreshCcw } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { isNil, PopulatedAgent } from '@activepieces/shared';
import { useTableState } from './ap-table-state-provider';

type ApTableTriggersProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateAgent: (agent: PopulatedAgent) => void;
  trigger?: React.ReactNode;
};

export function ApTableTriggers({ open, onOpenChange, trigger, updateAgent }: ApTableTriggersProps) {
  const [table] = useTableState((state) => [state.table]);
  const [triggerOnNewRow, setTriggerOnNewRow] = useState(table.agent?.settings?.triggerOnNewRow ?? false);
  const [triggerOnFieldUpdate, setTriggerOnFieldUpdate] = useState(table.agent?.settings?.triggerOnFieldUpdate ?? false);
  const { mutate: updateAgentSettings } = agentHooks.useUpdate(
    table.agent?.id ?? '',
    updateAgent,
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div onClick={(e) => e.preventDefault()}>{trigger}</div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[250px] max-h-[85vh] overflow-y-auto p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="relative p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                    <FilePlus className="h-4 w-4" />
                    <span className="text-sm">New row is added</span>
                </div>
            <Switch
                checked={triggerOnNewRow}
                onCheckedChange={(value) => {
                setTriggerOnNewRow(value);
                if (table.agent) {
                  updateAgentSettings(
                    {
                      ...table.agent,
                      settings: {
                        ...table.agent.settings,
                        triggerOnNewRow: value,
                      },
                    },
                  );
                }
                }}
            />
            </div>
            <Separator />
            <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    <span className="text-sm">Any field is updated</span>
                </div>
            <Switch
                checked={triggerOnFieldUpdate}
                onCheckedChange={(value) => {
                setTriggerOnFieldUpdate(value);
                if (table.agent) {
                  updateAgentSettings({
                    ...table.agent,
                    settings: {
                        ...table.agent.settings,
                        triggerOnFieldUpdate: value,
                    },
                  });
                }
                }}
            />
            </div>
        </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
