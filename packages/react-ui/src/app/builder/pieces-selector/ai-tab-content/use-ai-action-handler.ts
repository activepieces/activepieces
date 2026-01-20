import { t } from 'i18next';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useTelemetry } from '@/components/telemetry-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { PieceSelectorItem, PieceSelectorOperation } from '@/lib/types';
import {
  ApFlagId,
  FlowActionType,
  TelemetryEventName,
} from '@activepieces/shared';

import { usePieceSearchContext } from '../../../../features/pieces/lib/piece-search-context';
import { useBuilderStateContext } from '../../builder-hooks';

import { getActionName } from './ai-actions-constants';

export const useAIActionHandler = (operation: PieceSelectorOperation) => {
  const { capture } = useTelemetry();
  const { searchQuery } = usePieceSearchContext();
  const [handleAddingOrUpdatingStep] = useBuilderStateContext((state) => [
    state.handleAddingOrUpdatingStep,
  ]);
  const { data: isAgentsConfigured } = flagsHooks.useFlag<boolean>(
    ApFlagId.AGENTS_CONFIGURED
  );
  const navigate = useNavigate();

  const showAgentsNotConfiguredToast = useCallback(() => {
    toast('Connect to OpenAI', {
      description: t(
        "To create an agent, you'll first need to connect to OpenAI in platform settings."
      ),
      action: {
        label: 'Set Up',
        onClick: () => {
          navigate('/platform/setup/ai');
        },
      },
    });
  }, [navigate]);

  const handleActionClick = useCallback(
    (item: PieceSelectorItem) => {
      if (!isAgentsConfigured) {
        showAgentsNotConfiguredToast();
        return;
      }

      const actionName = getActionName(item);
      if (item.type === FlowActionType.PIECE && actionName) {
        capture({
          name: TelemetryEventName.PIECE_SELECTOR_SEARCH,
          payload: {
            search: searchQuery,
            isTrigger: false,
            selectedActionOrTriggerName: actionName,
          },
        });
      }

      handleAddingOrUpdatingStep({
        pieceSelectorItem: item,
        operation,
        selectStepAfter: true,
      });
    },
    [
      isAgentsConfigured,
      showAgentsNotConfiguredToast,
      capture,
      searchQuery,
      handleAddingOrUpdatingStep,
      operation,
    ]
  );

  return { handleActionClick };
};
