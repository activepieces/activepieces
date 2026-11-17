import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { CornerLeftUp } from 'lucide-react';
import { Link } from 'react-router-dom';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { authenticationSession } from '@/lib/authentication-session';

import { useBuilderStateContext } from '../builder-hooks';

import { enclosingBatchStep } from './use-step-output-in-run';

const BatchChildContextStrip = () => {
  const [run, flowVersion] = useBuilderStateContext((state) => [
    state.run,
    state.flowVersion,
  ]);
  if (isNil(run) || isNil(run.parentRunId) || isNil(run.dispatchIndex)) {
    return <></>;
  }
  const batchStepDisplayName =
    Object.keys(run.steps ?? {})
      .map((stepName) =>
        enclosingBatchStep({ stepName, trigger: flowVersion.trigger }),
      )
      .find((step) => !isNil(step))?.displayName ?? null;
  const batchNumber = run.dispatchIndex + 1;
  const parentRunLabel = `${flowVersion.displayName} · #${run.parentRunId.slice(
    -6,
  )}`;

  return (
    <div className="flex min-w-0 items-center gap-2 px-1 pb-2 text-xs text-gray-11">
      <CornerLeftUp className="size-3.5 shrink-0" />
      <span className="shrink-0">
        {isNil(batchStepDisplayName)
          ? t('Batch {batch} of a parent run', { batch: batchNumber })
          : t('Batch {batch} of {step} in run', {
              batch: batchNumber,
              step: batchStepDisplayName,
            })}
      </span>
      <TextWithTooltip tooltipMessage={parentRunLabel}>
        <Link
          className="truncate text-accent-11 underline"
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

BatchChildContextStrip.displayName = 'BatchChildContextStrip';

export { BatchChildContextStrip };
