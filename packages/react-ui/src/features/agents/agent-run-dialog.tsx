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
      <DialogContent className="w-full max-w-[60rem] min-h-[65vh] max-h-[65vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('Agent Result')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <AgentTimeline
            agentRunId={agentRunId}
            className="h-full p-0 pr-3 w-full flex-1 min-h-0"
          />
        </div>
        <DialogFooter className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AgentRunDialog };
