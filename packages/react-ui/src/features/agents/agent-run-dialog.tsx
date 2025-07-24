import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="w-full max-w-[60rem] overflow-hidden ">
        <DialogHeader>
          <DialogTitle>{t('Agent Test Results')}</DialogTitle>
        </DialogHeader>
        <AgentTimeline
          agentRunId={agentRunId}
          className="h-full p-0 pr-3 w-full"
        />
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AgentRunDialog };
