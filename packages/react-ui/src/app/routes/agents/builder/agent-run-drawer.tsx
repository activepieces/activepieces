import { ArrowLeft, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { AgentTimeline } from '@/features/agents/agent-timeline';
import { agentRunHooks } from '@/features/agents/lib/agent-hooks';
import { agentRunUtils } from '@/features/agents/lib/agent-run-utils';
import { formatUtils } from '@/lib/utils';

interface AgentRunDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentRunId: string | null | undefined;
}

export function AgentRunDrawer({
  open,
  onOpenChange,
  agentRunId,
}: AgentRunDrawerProps) {
  const { data: agentRun } = agentRunHooks.useGet(agentRunId);

  const { variant, Icon } = agentRun
    ? agentRunUtils.getStatusIcon(agentRun.status)
    : { variant: null, Icon: Play };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      dismissible={true}
      modal={true}
    >
      <DrawerContent className="w-[700px] overflow-x-hidden ">
        <DrawerHeader className="border-none">
          <div className="p-2">
            <div className="flex items-center gap-1">
              <Button
                variant="basic"
                size={'icon'}
                className="text-foreground"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <DrawerTitle>Agent Run Details</DrawerTitle>
              <div className="flex items-center gap-2 ml-4">
                {agentRun && variant && (
                  <StatusIconWithText
                    icon={Icon}
                    text={formatUtils.convertEnumToHumanReadable(
                      agentRun.status,
                    )}
                    variant={variant}
                  />
                )}
              </div>
            </div>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden p-4">
          <AgentTimeline agentRunId={agentRunId} className="h-full" />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
