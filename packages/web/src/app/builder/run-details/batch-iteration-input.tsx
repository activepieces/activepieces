import { isNil } from '@activepieces/core-utils';
import { FlowActionType, flowStructureUtil } from '@activepieces/shared';
import { t } from 'i18next';
import { useMemo } from 'react';

import { useBuilderStateContext } from '../builder-hooks';

import { batchRailUtils } from './batch-rail-utils';
import { IterationRail } from './iteration-rail';
import { iterationRailUtils } from './iteration-rail-utils';
import { useBatchStepRun } from './use-batch-logs';

const BatchIterationInput = ({ stepName }: { stepName: string }) => {
  const [setBatchIndex, run, stepType] = useBuilderStateContext((state) => [
    state.setBatchIndex,
    state.run,
    flowStructureUtil.getStep(stepName, state.flowVersion.trigger)?.type,
  ]);
  const isBatchStep = stepType === FlowActionType.PROCESS_IN_BATCHES;
  const { output, total, current, children } = useBatchStepRun(
    isBatchStep ? stepName : null,
  );
  const statuses = useMemo(
    () =>
      isNil(output) || total > iterationRailUtils.MAX_RENDERED_DOTS
        ? []
        : batchRailUtils.dotStatuses({ output, children }),
    [output, children, total],
  );

  if (isNil(run) || isNil(output) || total === 0) {
    return <></>;
  }

  return (
    <IterationRail
      total={total}
      current={current}
      statuses={statuses}
      onSelect={(index) => setBatchIndex({ stepName, index })}
      inputTooltip={t('Show step logs for batch ({batch}/{total})', {
        batch: current + 1,
        total,
      })}
      itemLabel={(index) => {
        const { from, to } = batchRailUtils.itemRange({
          output,
          batchIndex: index,
        });
        return t('Batch {batch} · items {from}–{to}', {
          batch: index + 1,
          from,
          to,
        });
      }}
    />
  );
};

BatchIterationInput.displayName = 'BatchIterationInput';

export { BatchIterationInput };
