import { Value } from '@sinclair/typebox/value';
import { useRef } from 'react';

import {
  PieceSelectorItem,
  PieceSelectorPieceItem,
  PieceStepMetadataWithSuggestions,
} from '@/lib/types';
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework';
import {
  Action,
  ActionType,
  BranchOperator,
  CodeAction,
  PieceAction,
  PieceTrigger,
  Trigger,
  TriggerType,
  deepMergeAndCast,
  BranchExecutionType,
  RouterExecutionType,
  spreadIfDefined,
  isNil,
  flowStructureUtil,
  StepSettings,
  RouterActionSettingsWithValidation,
} from '@activepieces/shared';

import { formUtils } from './form-utils';
const defaultCode = `export const code = async (inputs) => {
  return true;
};`;

//can't remove this from search results, because it is used to add actions to the flow, check todo-dialog for more details
const hiddenActions = [
  {
    pieceName: '@activepieces/piece-todos',
    actionName: 'wait_for_approval',
  },
  {
    pieceName: '@activepieces/piece-todos',
    actionName: 'createTodoAndWait',
  },
];

const removeHiddenActions = (
  pieceMetadata: PieceStepMetadataWithSuggestions,
) => {
  const actions = Object.values(pieceMetadata.suggestedActions ?? {});
  const actionsWithoutHidden = Object.values(actions).filter(
    (action) =>
      !hiddenActions.some(
        (hidden) =>
          hidden.actionName === action.name &&
          hidden.pieceName === pieceMetadata.pieceName,
      ),
  );
  return actionsWithoutHidden;
};

const isPieceActionOrTrigger = (
  pieceSelectorItem: PieceSelectorItem,
): pieceSelectorItem is PieceSelectorPieceItem => {
  return (
    pieceSelectorItem.type === ActionType.PIECE ||
    (flowStructureUtil.isTrigger(pieceSelectorItem.type) &&
      pieceSelectorItem.type === TriggerType.PIECE)
  );
};

const isStepInitiallyValid = (
  pieceSelectorItem: PieceSelectorItem,
  overrideDefaultSettings?: StepSettings,
) => {
  switch (pieceSelectorItem.type) {
    case ActionType.CODE:
      return true;
    case ActionType.PIECE:
    case TriggerType.PIECE: {
      const overridingInput =
        overrideDefaultSettings && 'input' in overrideDefaultSettings
          ? overrideDefaultSettings.input
          : undefined;
      const inputValidity = checkPieceInputValidity(
        overridingInput ?? getInitalStepInput(pieceSelectorItem),
        pieceSelectorItem.actionOrTrigger.props,
      );
      const needsAuth = pieceSelectorItem.actionOrTrigger.requireAuth;
      const hasAuth = !isNil(pieceSelectorItem.pieceMetadata.auth);
      return inputValidity && (!needsAuth || !hasAuth);
    }
    case ActionType.LOOP_ON_ITEMS: {
      if (
        overrideDefaultSettings &&
        'input' in overrideDefaultSettings &&
        overrideDefaultSettings.input.items
      ) {
        return true;
      }
      return false;
    }
    case TriggerType.EMPTY: {
      return false;
    }
    case ActionType.ROUTER: {
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
  return formUtils.getDefaultValueForStep(
    {
      ...spreadIfDefined('auth', pieceSelectorItem.pieceMetadata.auth),
      ...pieceSelectorItem.actionOrTrigger.props,
    },
    {},
  );
};

const getDefaultStepValues = ({
  stepName,
  pieceSelectorItem,
  overrideDefaultSettings,
}: {
  stepName: string;
  pieceSelectorItem: PieceSelectorItem;
  overrideDefaultSettings?: StepSettings;
}): Action | Trigger => {
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
      inputUiInfo: {
        customizedInputs: {},
      },
    },
  };

  switch (pieceSelectorItem.type) {
    case ActionType.CODE:
      return deepMergeAndCast<CodeAction>(
        {
          type: ActionType.CODE,
          settings: overrideDefaultSettings ?? {
            sourceCode: {
              code: defaultCode,
              packageJson: '{}',
            },
            input,
            inputUiInfo: {
              customizedInputs: {},
            },
            errorHandlingOptions,
          },
        },
        common,
      );
    case ActionType.LOOP_ON_ITEMS:
      return deepMergeAndCast<Action>(
        {
          type: ActionType.LOOP_ON_ITEMS,
          settings: overrideDefaultSettings ?? {
            items: '',
            inputUiInfo: {
              customizedInputs: {},
            },
          },
        },
        common,
      );
    case ActionType.ROUTER:
      return deepMergeAndCast<Action>(
        {
          type: ActionType.ROUTER,
          settings: overrideDefaultSettings ?? {
            executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
            branches: [
              {
                conditions: [
                  [
                    {
                      operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                      firstValue: '',
                      secondValue: '',
                      caseSensitive: false,
                    },
                  ],
                ],
                branchType: BranchExecutionType.CONDITION,
                branchName: 'Branch 1',
              },
              {
                branchType: BranchExecutionType.FALLBACK,
                branchName: 'Otherwise',
              },
            ],
            inputUiInfo: {
              customizedInputs: {},
            },
          },
          children: [null, null],
        },
        common,
      );
    case ActionType.PIECE: {
      if (!isPieceActionOrTrigger(pieceSelectorItem)) {
        throw new Error(
          `Invalid piece selector item ${JSON.stringify(pieceSelectorItem)}`,
        );
      }
      return deepMergeAndCast<PieceAction>(
        {
          type: ActionType.PIECE,
          settings: overrideDefaultSettings ?? {
            pieceName: pieceSelectorItem.pieceMetadata.pieceName,
            pieceType: pieceSelectorItem.pieceMetadata.pieceType,
            packageType: pieceSelectorItem.pieceMetadata.packageType,
            actionName: pieceSelectorItem.actionOrTrigger.name,
            pieceVersion: pieceSelectorItem.pieceMetadata.pieceVersion,
            input,
            errorHandlingOptions,
          },
        },
        common,
      );
    }
    case TriggerType.PIECE: {
      if (!isPieceActionOrTrigger(pieceSelectorItem)) {
        throw new Error(
          `Invalid piece selector item ${JSON.stringify(pieceSelectorItem)}`,
        );
      }
      return deepMergeAndCast<PieceTrigger>(
        {
          type: TriggerType.PIECE,
          settings: overrideDefaultSettings ?? {
            pieceName: pieceSelectorItem.pieceMetadata.pieceName,
            pieceType: pieceSelectorItem.pieceMetadata.pieceType,
            packageType: pieceSelectorItem.pieceMetadata.packageType,
            triggerName: pieceSelectorItem.actionOrTrigger.name,
            pieceVersion: pieceSelectorItem.pieceMetadata.pieceVersion,
            input,
          },
        },
        common,
      );
    }
    default:
      throw new Error('Unsupported type: ' + pieceSelectorItem.type);
  }
};

const checkPieceInputValidity = (
  input: Record<string, unknown>,
  props: PiecePropertyMap,
) => {
  return Object.entries(props).reduce((acc, [key, property]) => {
    if (
      property.required &&
      property.type !== PropertyType.DYNAMIC &&
      isNil(input[key])
    ) {
      return false;
    }
    return acc;
  }, true);
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
const SEARCH_INPUT_DIV_HEIGHT = 48 as const;
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
export const pieceSelectorUtils = {
  getDefaultStepValues,
  useAdjustPieceListHeightToAvailableSpace,
  isMcpToolTrigger,
  isChatTrigger,
  removeHiddenActions,
};
