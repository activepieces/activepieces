import { t } from 'i18next';
import { SearchX, WandSparkles } from 'lucide-react';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { PieceSelectorOperation } from '@/features/pieces/lib/types';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApFlagId, FlowOperationType, supportUrl } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { AskAiButton } from './ask-ai';

const RequestPieceButton = () => {
  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => {
        window.open(
          `${supportUrl}/c/feature-requests/9`,
          '_blank',
          'noopener noreferrer',
        );
      }}
    >
      {t('Request Piece')}
    </Button>
  );
};

const NoResultsFound = ({
  operation,
}: {
  operation: PieceSelectorOperation;
}) => {
  const isCopilotEnabled = platformHooks.isCopilotEnabled();
  const { data: showCommunityLinks } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const [setOpenedPieceSelectorId] = useBuilderStateContext((state) => [
    state.setOpenedPieceSelectorId,
  ]);
  const isEmbedding = useEmbedding().embedState.isEmbedded;
  const showRequestPieceButton = showCommunityLinks && !isEmbedding;
  const isUpdateTriggerOperation =
    operation.type === FlowOperationType.UPDATE_TRIGGER;
  if (isCopilotEnabled && !isUpdateTriggerOperation) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-full ">
        <WandSparkles className="w-14 h-14" />
        <div className="text-sm mb-3">
          {t('Let our AI assistant help you out')}
        </div>
        <AskAiButton
          varitant={'default'}
          operation={operation}
          onClick={() => setOpenedPieceSelectorId(null)}
        ></AskAiButton>
        {showRequestPieceButton && (
          <>
            {t('Or')}
            <RequestPieceButton />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-full ">
      <SearchX className="w-14 h-14" />
      <div className="text-sm ">{t('No pieces found')}</div>
      <div className="text-sm ">{t('Try adjusting your search')}</div>
      {showRequestPieceButton && <RequestPieceButton />}
    </div>
  );
};

export { NoResultsFound };
