import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AgentTimeline } from '@/features/agents/agent-timeline';

type AgentRunDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentRunId: string | null | undefined;
};

function AgentRunDialog({
  open,
  onOpenChange,
  agentRunId,
}: AgentRunDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[42rem] overflow-hidden ">
        <DialogHeader>
          <DialogTitle>{t('Agent Test Results')}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] min-h-[40vh] ">
          <AgentTimeline
            agentRunId={agentRunId}
            className="h-full p-0 pr-3 max-w-[39.25rem]"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AgentRunDialog };
