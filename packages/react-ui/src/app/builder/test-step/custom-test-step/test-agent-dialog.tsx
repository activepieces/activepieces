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
import {
  AgentTestResult,
  AgentStepBlock,
  StepRunResponse,
  AgentTaskStatus,
  isNil,
} from '@activepieces/shared';

type AgentTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentProgress: StepRunResponse | null;
  isTesting: boolean;
  agentId: string;
};

function AgentTestingDialog({
  open,
  onOpenChange,
  agentProgress,
  agentId,
}: AgentTestingDialogProps) {
  const agentResult = agentProgress?.output as AgentTestResult | undefined;
  const agentSteps: AgentStepBlock[] = agentResult?.steps || [];
  const prompt =
    !isNil(agentProgress?.input) &&
    'prompt' in (agentProgress.input as { prompt: string })
      ? (agentProgress.input as { prompt: string }).prompt
      : '';
  const isDone =
    agentResult?.status === AgentTaskStatus.COMPLETED ||
    agentResult?.status === AgentTaskStatus.FAILED;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[42rem] overflow-hidden ">
        <DialogHeader>
          <DialogTitle>{t('Agent Test Results')}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] min-h-[40vh] ">
          <AgentTimeline
            agentId={agentId}
            steps={agentSteps}
            className="h-full p-0 pr-3 max-w-[39.25rem]"
            prompt={prompt}
            isDone={isDone}
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

export { AgentTestingDialog };
