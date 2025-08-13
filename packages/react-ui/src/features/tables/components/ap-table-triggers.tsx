import { FilePlus, RefreshCcw } from 'lucide-react';
import { useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { PopulatedAgent } from '@activepieces/shared';

import { useTableState } from './ap-table-state-provider';

type ApTableTriggersProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateAgent: (agent: PopulatedAgent) => void;
  trigger?: React.ReactNode;
  toolTipMessage: string;
};

export function ApTableTriggers({
  open,
  onOpenChange,
  trigger,
  updateAgent,
  toolTipMessage,
}: ApTableTriggersProps) {
  const [table] = useTableState((state) => [state.table]);
  const [triggerOnNewRow, setTriggerOnNewRow] = useState(
    table.agent?.settings?.triggerOnNewRow ?? false,
  );
  const [triggerOnFieldUpdate, setTriggerOnFieldUpdate] = useState(
    table.agent?.settings?.triggerOnFieldUpdate ?? false,
  );
  const { mutate: updateAgentSettings } = agentHooks.useUpdate(
    table.agent?.id ?? '',
    updateAgent,
  );

  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent>
        <p>{toolTipMessage}</p>
      </TooltipContent>
    </Tooltip>
  );
}
