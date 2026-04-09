import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

import { FlowLockWidget } from './flow-lock-widget';
import { PublishFlowReminderWidget } from './publish-flow-reminder-widget';
import { RunInfoWidget } from './run-info-widget';
import { useFlowLock } from './use-flow-lock';
import { ViewingOldVersionWidget } from './viewing-old-version-widget';

const BuilderBanner = () => {
  const { lockedBy, takeOver } = useFlowLock();
  const run = useBuilderStateContext((state) => state.run);

  if (lockedBy) {
    return <FlowLockWidget lockedBy={lockedBy} takeOver={takeOver} />;
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
