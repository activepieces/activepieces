import {
  FlowAction,
  FlowRun,
  FlowTrigger,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { JsonViewer } from '@/components/custom/json-viewer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';
import { stepsHooks } from '@/features/pieces';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';

type FailedStepDialogProps = {
  run: FlowRun | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const FailedStepDialog = ({
  run,
  open,
  onOpenChange,
}: FailedStepDialogProps) => {
  const navigate = useNavigate();
  const failedStep = run?.failedStep;

  const { data: populatedFlow } = flowHooks.useGetFlow({
    flowId: run?.flowId ?? '',
    versionId: run?.flowVersionId,
    enabled: open && !isNil(run) && !isNil(failedStep),
  });

  if (isNil(run) || isNil(failedStep)) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg" />
      </Dialog>
    );
  }

  const flowVersion = populatedFlow?.version;
  const stepNode = flowVersion
    ? flowStructureUtil.getStep(failedStep.name, flowVersion.trigger)
    : undefined;
  const stepNumber = flowVersion
    ? flowStructureUtil.getStepNumber(flowVersion.trigger, failedStep.name)
    : null;
  const flowName =
    run.flowVersion?.displayName ?? flowVersion?.displayName ?? '';
  const failureTimestamp = run.finishTime ?? run.startTime ?? run.created;
  const { Icon: RunStatusIcon } = flowRunUtils.getStatusIcon(run.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <RunStatusIcon className="size-4 shrink-0 text-destructive-800 dark:text-destructive-200" />
            <span className="truncate">{flowName || t('Run Failed')}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {failureTimestamp
              ? formatUtils.formatDateWithTime(new Date(failureTimestamp), true)
              : null}
          </DialogDescription>
        </DialogHeader>
        {failedStep.message ? (
          <JsonViewer
            json={failedStep.message}
            title={
              <span className="flex items-center gap-2 min-w-0">
                {stepNode ? (
                  <StepIconBadge step={stepNode} />
                ) : (
                  <Skeleton className="size-[25px] rounded-md shrink-0" />
                )}
                <span className="truncate">
                  {stepNumber
                    ? `${stepNumber}. ${failedStep.displayName}`
                    : failedStep.displayName}
                </span>
              </span>
            }
            hideDownload
          />
        ) : (
          <div className="text-sm italic text-muted-foreground">
            {t('No error message available')}
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() =>
              navigate(
                authenticationSession.appendProjectRoutePrefix(
                  `/runs/${run.id}`,
                ),
              )
            }
          >
            <ArrowRight className="size-4" />
            {t('Go to run')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StepIconBadge = ({ step }: { step: FlowAction | FlowTrigger }) => {
  const { stepMetadata, isLoading } = stepsHooks.useStepMetadata({ step });
  if (isLoading || !stepMetadata) {
    return <Skeleton className="size-[25px] rounded-md shrink-0" />;
  }
  return (
    <PieceIcon
      logoUrl={stepMetadata.logoUrl}
      displayName={stepMetadata.displayName}
      size="xs"
      border={false}
      showTooltip={false}
    />
  );
};
