import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AgentTimeline } from '@/features/agents/agent-timeline';
import {
  AgentTestResult,
  AgentStepBlock,
  StepRunResponse,
  isNil,
} from '@activepieces/shared';
import { Button } from '@/components/ui/button';

type AgentTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentProgress: StepRunResponse | null;
  isTesting: boolean;
};

function AgentTestingDialog({
  open,
  onOpenChange,
  agentProgress,
}: AgentTestingDialogProps) {

  const agentResult = agentProgress?.output as AgentTestResult | undefined;
  const agentSteps: AgentStepBlock[] = agentResult?.steps || [];
  const prompt = !isNil(agentProgress?.input) && 'prompt' in (agentProgress.input as { prompt: string }) 
    ? (agentProgress.input as { prompt: string }).prompt 
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Agent Test Results</DialogTitle>
        </DialogHeader>
        <div className="h-[40vh]">
          <AgentTimeline
            steps={agentSteps}
            prompt={prompt}
            className="h-full"
          />
        </div>
        <DialogFooter className="">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AgentTestingDialog };
