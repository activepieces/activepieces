import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  FlowTrigger,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CornerLeftUp } from 'lucide-react';
import { Link } from 'react-router-dom';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { authenticationSession } from '@/lib/authentication-session';

import { useBuilderStateContext } from '../builder-hooks';

const BatchChildContextStrip = () => {
  const [run, flowVersion] = useBuilderStateContext((state) => [
    state.run,
    state.flowVersion,
  ]);
  if (isNil(run) || isNil(run.parentRunId) || isNil(run.dispatchIndex)) {
    return <></>;
  }
  const batchStepDisplayName = batchStepOfChild({
    trigger: flowVersion.trigger,
    childStepNames: Object.keys(run.steps ?? {}),
  });
  const batch = run.dispatchIndex + 1;
  const parentRunLabel = `${flowVersion.displayName} · #${run.parentRunId.slice(
    -6,
  )}`;

  return (
    <div className="flex min-w-0 items-center gap-2 px-1 pb-2 text-xs text-muted-foreground">
      <CornerLeftUp className="size-3.5 shrink-0" />
      <span className="shrink-0">
        {isNil(batchStepDisplayName)
          ? t('Batch {batch} of a parent run', { batch })
          : t('Batch {batch} of {step} in run', {
              batch,
              step: batchStepDisplayName,
            })}
      </span>
      <TextWithTooltip tooltipMessage={parentRunLabel}>
        <Link
          className="truncate text-primary underline"
          to={authenticationSession.appendProjectRoutePrefix(
            `/runs/${run.parentRunId}`,
          )}
        >
          {parentRunLabel}
        </Link>
      </TextWithTooltip>
    </div>
  );
};

function batchStepOfChild({
  trigger,
  childStepNames,
}: {
  trigger: FlowTrigger;
  childStepNames: string[];
}): string | null {
  const batchStep = flowStructureUtil
    .getAllSteps(trigger)
    .filter((step) => step.type === FlowActionType.PROCESS_IN_BATCHES)
    .find((step) =>
      childStepNames.some((childStepName) =>
        flowStructureUtil.isChildOf(step, childStepName),
      ),
    );
  return batchStep?.displayName ?? null;
}

BatchChildContextStrip.displayName = 'BatchChildContextStrip';

export { BatchChildContextStrip };
