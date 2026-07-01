import { isNil } from '@activepieces/core-utils';
import { LockerKind } from '@activepieces/shared';

import { ResourceLockWidget } from '@/components/custom/resource-lock-widget';

import { useBuilderStateContext } from '../../builder-hooks';

import { PublishFlowReminderWidget } from './publish-flow-reminder-widget';
import { RunInfoWidget } from './run-info-widget';
import { useFlowLock } from './use-flow-lock';
import { useFlowRealtime } from './use-flow-realtime';
import { ViewingOldVersionWidget } from './viewing-old-version-widget';

const BuilderBanner = () => {
  const { lockedBy, takeOver } = useFlowLock();
  const [run, flowId] = useBuilderStateContext((state) => [
    state.run,
    state.flow.id,
  ]);
  useFlowRealtime({
    flowId,
    isAiActive: lockedBy?.lockerKind === LockerKind.AI,
  });

  if (lockedBy) {
    return (
      <ResourceLockWidget
        lockedBy={lockedBy}
        takeOver={takeOver}
        resourceLabel="flow"
      />
    );
  }
  if (!isNil(run)) {
    return <RunInfoWidget />;
  }
  return (
    <>
      <ViewingOldVersionWidget />
      <PublishFlowReminderWidget />
    </>
  );
};

BuilderBanner.displayName = 'BuilderBanner';
export { BuilderBanner };
