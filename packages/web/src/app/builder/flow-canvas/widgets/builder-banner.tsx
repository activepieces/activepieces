import { isNil } from '@activepieces/core-utils';

import { RightSideBarType } from '@/app/builder/types';
import { ResourceLockWidget } from '@/components/custom/resource-lock-widget';
import { useEmbedding } from '@/components/providers/embed-provider';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';

import { FlowApprovalBanner } from './flow-approval-banner';
import { PublishFlowReminderWidget } from './publish-flow-reminder-widget';
import { RunInfoWidget } from './run-info-widget';
import { useFlowLock } from './use-flow-lock';
import { ViewingOldVersionWidget } from './viewing-old-version-widget';

const BuilderBanner = () => {
  const { lockedBy, takeOver } = useFlowLock();
  const [run, rightSidebar] = useBuilderStateContext((state) => [
    state.run,
    state.rightSidebar,
  ]);
  const { embedState } = useEmbedding();

  if (lockedBy) {
    const sitsInRoundedCard = !embedState.isEmbedded;
    return (
      <ResourceLockWidget
        lockedBy={lockedBy}
        takeOver={takeOver}
        className={cn(
          sitsInRoundedCard && 'rounded-bl-[calc(var(--radius-xl)-1px)]',
          sitsInRoundedCard &&
            rightSidebar === RightSideBarType.NONE &&
            'rounded-br-[calc(var(--radius-xl)-1px)]',
        )}
      />
    );
  }
  if (!isNil(run)) {
    return <RunInfoWidget />;
  }
  return (
    <>
      <FlowApprovalBanner />
      <ViewingOldVersionWidget />
      <PublishFlowReminderWidget />
    </>
  );
};

BuilderBanner.displayName = 'BuilderBanner';
export { BuilderBanner };
