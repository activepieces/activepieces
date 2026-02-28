import { piecePropertiesUtils } from '@activepieces/pieces-framework';
import {
  FlowActionKind,
  BranchOperator,
  CodeAction,
  PieceAction,
  PieceTrigger,
  deepMergeAndCast,
  BranchExecutionType,
  RouterExecutionType,
  isNil,
  flowStructureUtil,
  StepSettings,
  RouterActionSettingsWithValidation,
  FlowTriggerKind,
  PropertyExecutionType,
  DEFAULT_SAMPLE_DATA_SETTINGS,
  FlowVersion,
  FlowOperationType,
  isManualPieceTrigger,
  FlowNodeData,
  FlowAction,
} from '@activepieces/shared';
import { Value } from '@sinclair/typebox/value';
import { useRef } from 'react';

import {
  PieceSelectorItem,
  PieceSelectorOperation,
  PieceSelectorPieceItem,
  PieceStepMetadataWithSuggestions,
} from '@/lib/types';

import { formUtils } from './form-utils';
const defaultCode = `export const code = async (inputs) => {
  return true;
};`;

const removeHiddenActions = (
  pieceMetadata: PieceStepMetadataWithSuggestions,
) => {
  const actions = Object.values(pieceMetadata.suggestedActions ?? {});
  return actions;
};

const isPieceActionOrTrigger = (
  pieceSelectorItem: PieceSelectorItem,
): pieceSelectorItem is PieceSelectorPieceItem => {
  return (
    pieceSelectorItem.type === FlowActionKind.PIECE ||
    (flowStructureUtil.isTrigger(pieceSelectorItem.type) &&
      pieceSelectorItem.type === FlowTriggerKind.PIECE)
  );
};

const isStepInitiallyValid = (
  pieceSelectorItem: PieceSelectorItem,
  overrideDefaultSettings?: StepSettings,
) => {
  switch (pieceSelectorItem.type) {
    case FlowActionKind.CODE:
      return true;
    case FlowActionKind.PIECE:
    case FlowTriggerKind.PIECE: {
      const overridingInput =
        overrideDefaultSettings && 'input' in overrideDefaultSettings
          ? overrideDefaultSettings.input
          : undefined;
      const input = overridingInput ?? getInitalStepInput(pieceSelectorItem);
      const schema = piecePropertiesUtils.buildSchema(
        pieceSelectorItem.actionOrTrigger.props,
        pieceSelectorItem.pieceMetadata.auth,
      );
      const isValid = Value.Errors(schema, input).First() === undefined;
      const needsAuth = pieceSelectorItem.actionOrTrigger.requireAuth;
      const hasAuth = !isNil(pieceSelectorItem.pieceMetadata.auth);
      return isValid && (!needsAuth || !hasAuth);
    }
    case FlowActionKind.LOOP_ON_ITEMS: {
      if (
        overrideDefaultSettings &&
        'input' in overrideDefaultSettings &&
        overrideDefaultSettings.input.items
      ) {
        return true;
      }
      return false;
    }
    case FlowTriggerKind.EMPTY: {
      return false;
    }
    case FlowActionKind.ROUTER: {
      if (overrideDefaultSettings) {
        const errors = Array.from(
          Value.Errors(
            RouterActionSettingsWithValidation,
            overrideDefaultSettings,
          ),
        );
        return errors.length === 0;
      }
      return false;
    }
  }
};

const getInitalStepInput = (pieceSelectorItem: PieceSelectorItem) => {
  if (!isPieceActionOrTrigger(pieceSelectorItem)) {
    return {};
  }
  return formUtils.getDefaultValueForProperties({
    props: {
      ...pieceSelectorItem.actionOrTrigger.props,
    },
    existingInput: {},
  });
};

const getDefaultStepValues = ({
  stepName,
  pieceSelectorItem,
  overrideDefaultSettings,
  customLogoUrl,
}: {
  stepName: string;
  pieceSelectorItem: PieceSelectorItem;
  overrideDefaultSettings?: StepSettings;
  customLogoUrl?: string;
}): FlowNodeData & { name: string } => {
  const errorHandlingOptions: CodeAction['settings']['errorHandlingOptions'] = {
    continueOnFailure: {
      value: false,
    },
    retryOnFailure: {
      value: false,
    },
  };

  const input = getInitalStepInput(pieceSelectorItem);
  const isValid = isStepInitiallyValid(
    pieceSelectorItem,
    overrideDefaultSettings,
  );
  const common = {
    name: stepName,
    valid: isValid,
    displayName: isPieceActionOrTrigger(pieceSelectorItem)
      ? pieceSelectorItem.actionOrTrigger.displayName
      : pieceSelectorItem.displayName,
    skip: false,
    settings: {
      customLogoUrl,
      sampleData: DEFAULT_SAMPLE_DATA_SETTINGS,
    },
  };

  switch (pieceSelectorItem.type) {
    case FlowActionKind.CODE:
      return deepMergeAndCast<CodeAction>(
        {
          kind: FlowActionKind.CODE,
          settings: overrideDefaultSettings ?? {
            sourceCode: {
              code: defaultCode,
              packageJson: '{}',
            },
            input,
            errorHandlingOptions,
          },
        },
        common,
      );
    case FlowActionKind.LOOP_ON_ITEMS:
      return deepMergeAndCast<FlowAction>(
        {
          kind: FlowActionKind.LOOP_ON_ITEMS,
          settings: overrideDefaultSettings ?? {
            items: '',
          },
        },
        common,
      );
    case FlowActionKind.ROUTER:
      return deepMergeAndCast<FlowAction>(
        {
          kind: FlowActionKind.ROUTER,
          settings: overrideDefaultSettings ?? {
            executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
          },
        },
        common,
      );
    case FlowActionKind.PIECE: {
      if (!isPieceActionOrTrigger(pieceSelectorItem)) {
        throw new Error(
          `Invalid piece selector item ${JSON.stringify(pieceSelectorItem)}`,
        );
      }
      return deepMergeAndCast<PieceAction>(
        {
          kind: FlowActionKind.PIECE,
          settings: overrideDefaultSettings ?? {
            pieceName: pieceSelectorItem.pieceMetadata.pieceName,
            actionName: pieceSelectorItem.actionOrTrigger.name,
            pieceVersion: pieceSelectorItem.pieceMetadata.pieceVersion,
            input,
            errorHandlingOptions,
            propertySettings: Object.fromEntries(
              Object.entries(input).map(([key]) => [
                key,
                {
                  type: PropertyExecutionType.MANUAL,
                  schema: undefined,
                },
              ]),
            ),
          },
        },
        common,
      );
    }
    case FlowTriggerKind.PIECE: {
      if (!isPieceActionOrTrigger(pieceSelectorItem)) {
        throw new Error(
          `Invalid piece selector item ${JSON.stringify(pieceSelectorItem)}`,
        );
      }
      return deepMergeAndCast<PieceTrigger>(
        {
          kind: FlowTriggerKind.PIECE,
          settings: overrideDefaultSettings ?? {
            pieceName: pieceSelectorItem.pieceMetadata.pieceName,
            triggerName: pieceSelectorItem.actionOrTrigger.name,
            pieceVersion: pieceSelectorItem.pieceMetadata.pieceVersion,
            input,
            propertySettings: Object.fromEntries(
              Object.entries(input).map(([key]) => [
                key,
                {
                  type: PropertyExecutionType.MANUAL,
                },
              ]),
            ),
          },
        },
        common,
      );
    }
    default:
      throw new Error('Unsupported type: ' + pieceSelectorItem.type);
  }
};

// Adjusts piece list height to prevent overflow on short screens
const useAdjustPieceListHeightToAvailableSpace = () => {
  const listHeightRef = useRef<number>(MAX_PIECE_SELECTOR_LIST_HEIGHT);
  const popoverTriggerRef = useRef<HTMLButtonElement | null>(null);

  if (!popoverTriggerRef.current) {
    return {
      listHeightRef,
      popoverTriggerRef,
      searchInputDivHeight: SEARCH_INPUT_DIV_HEIGHT,
    };
  }

  const popOverTriggerRect = popoverTriggerRef.current.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const shouldRenderBelowPopoverTrigger =
    popOverTriggerRect.top < viewportHeight - popOverTriggerRect.bottom;

  if (shouldRenderBelowPopoverTrigger) {
    const availableSpaceBelow =
      viewportHeight - popOverTriggerRect.bottom - SEARCH_INPUT_DIV_HEIGHT;
    listHeightRef.current = Math.max(
      MIN_PIECE_SELECTOR_LIST_HEIGHT,
      availableSpaceBelow,
    );
  } else {
    const availableSpaceAbove =
      popOverTriggerRect.top - SEARCH_INPUT_DIV_HEIGHT;
    listHeightRef.current = Math.max(
      MIN_PIECE_SELECTOR_LIST_HEIGHT,
      availableSpaceAbove,
    );
  }

  return {
    listHeightRef,
    popoverTriggerRef,
  };
};
const MAX_PIECE_SELECTOR_LIST_HEIGHT = 300 as const;
const MIN_PIECE_SELECTOR_LIST_HEIGHT = 100 as const;
const SEARCH_INPUT_DIV_HEIGHT = 113 as const;
const PIECE_ITEM_HEIGHT = 48 as const;
const ACTION_OR_TRIGGER_ITEM_HEIGHT = 41 as const;
const CATEGORY_ITEM_HEIGHT = 28 as const;
export const PIECE_SELECTOR_ELEMENTS_HEIGHTS = {
  MAX_PIECE_SELECTOR_LIST_HEIGHT,
  MIN_PIECE_SELECTOR_LIST_HEIGHT,
  SEARCH_INPUT_DIV_HEIGHT,
  PIECE_ITEM_HEIGHT,
  ACTION_OR_TRIGGER_ITEM_HEIGHT,
  CATEGORY_ITEM_HEIGHT,
};

const isMcpToolTrigger = (pieceName: string, triggerName: string) => {
  return pieceName === '@activepieces/piece-mcp' && triggerName === 'mcp_tool';
};

const isChatTrigger = (pieceName: string, triggerName: string) => {
  return (
    pieceName === '@activepieces/piece-forms' &&
    triggerName === 'chat_submission'
  );
};

const getStepNameFromOperationType = (
  operation: PieceSelectorOperation,
  flowVersion: FlowVersion,
) => {
  switch (operation.type) {
    case FlowOperationType.UPDATE_ACTION:
      return operation.stepName;
    case FlowOperationType.ADD_ACTION:
      return flowStructureUtil.findUnusedName(flowVersion);
    case FlowOperationType.UPDATE_TRIGGER:
      return 'trigger';
  }
};
export const pieceSelectorUtils = {
  getDefaultStepValues,
  useAdjustPieceListHeightToAvailableSpace,
  isMcpToolTrigger,
  isChatTrigger,
  removeHiddenActions,
  getStepNameFromOperationType,
  isManualTrigger: isManualPieceTrigger,
};
