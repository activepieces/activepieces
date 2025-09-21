import { Value } from '@sinclair/typebox/value';
import { useRef } from 'react';

import {
  PieceSelectorItem,
  PieceSelectorPieceItem,
  PieceStepMetadataWithSuggestions,
} from '@/lib/types';
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework';
import {
  FlowAction,
  FlowActionType,
  BranchOperator,
  CodeAction,
  PieceAction,
  PieceTrigger,
  FlowTrigger,
  deepMergeAndCast,
  BranchExecutionType,
  RouterExecutionType,
  spreadIfDefined,
  isNil,
  flowStructureUtil,
  StepSettings,
  FlowTriggerType,
  PropertyExecutionType,
  DEFAULT_SAMPLE_DATA_SETTINGS,
  ConditionType,
  RouterActionSettingsValidation,
} from '@activepieces/shared';

import { formUtils } from './form-utils';
import { autoPropertiesUtils } from './auto-properties-utils';
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
    pieceSelectorItem.type === FlowActionType.PIECE ||
    (flowStructureUtil.isTrigger(pieceSelectorItem.type) &&
      pieceSelectorItem.type === FlowTriggerType.PIECE)
  );
};

const isStepInitiallyValid = (
  pieceSelectorItem: PieceSelectorItem,
  overrideDefaultSettings?: StepSettings,
) => {
  switch (pieceSelectorItem.type) {
    case FlowActionType.CODE:
      return true;
    case FlowActionType.PIECE:
    case FlowTriggerType.PIECE: {
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
    case FlowActionType.LOOP_ON_ITEMS: {
      if (
        overrideDefaultSettings &&
        'input' in overrideDefaultSettings &&
        overrideDefaultSettings.input.items
      ) {
        return true;
      }
      return false;
    }
    case FlowTriggerType.EMPTY: {
      return false;
    }
    case FlowActionType.ROUTER: {
      if (overrideDefaultSettings) {
        const errors = Array.from(
          Value.Errors(
            RouterActionSettingsValidation,
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
  return formUtils.getDefaultValueForStep({
    props: {
      ...spreadIfDefined('auth', pieceSelectorItem.pieceMetadata.auth),
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
}): FlowAction | FlowTrigger => {
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
    case FlowActionType.CODE:
      return deepMergeAndCast<CodeAction>(
        {
          type: FlowActionType.CODE,
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
    case FlowActionType.LOOP_ON_ITEMS:
      return deepMergeAndCast<FlowAction>(
        {
          type: FlowActionType.LOOP_ON_ITEMS,
          settings: overrideDefaultSettings ?? {
            items: '',
          },
        },
        common,
      );
    case FlowActionType.ROUTER:
      return deepMergeAndCast<FlowAction>(
        {
          type: FlowActionType.ROUTER,
          settings: overrideDefaultSettings ?? {
            executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
            conditionType: ConditionType.LOGICAL,
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
                prompt: '',
                branchType: BranchExecutionType.CONDITION,
                branchName: 'Branch 1',
              },
              {
                branchType: BranchExecutionType.FALLBACK,
                branchName: 'Otherwise',
              },
            ],
          },
          children: [null, null],
        },
        common,
      );
    case FlowActionType.PIECE: {
      if (!isPieceActionOrTrigger(pieceSelectorItem)) {
        throw new Error(
          `Invalid piece selector item ${JSON.stringify(pieceSelectorItem)}`,
        );
      }
      
      const getDefaultPropertySettings = (props: PiecePropertyMap) => {
        return Object.fromEntries(
          Object.entries(props).map(([key, property]) => {
            const executionType = autoPropertiesUtils.determinePropertyExecutionType(key, property, props);
            return [
              key,
              {
                type: executionType,
                schema: undefined,
              },
            ];
          }),
        );
      };

      return deepMergeAndCast<PieceAction>(
        {
          type: FlowActionType.PIECE,
          settings: overrideDefaultSettings ?? {
            pieceName: pieceSelectorItem.pieceMetadata.pieceName,
            actionName: pieceSelectorItem.actionOrTrigger.name,
            pieceVersion: pieceSelectorItem.pieceMetadata.pieceVersion,
            input,
            errorHandlingOptions,
            propertySettings: getDefaultPropertySettings(pieceSelectorItem.actionOrTrigger.props),
          },
        },
        common,
      );
    }
    case FlowTriggerType.PIECE: {
      if (!isPieceActionOrTrigger(pieceSelectorItem)) {
        throw new Error(
          `Invalid piece selector item ${JSON.stringify(pieceSelectorItem)}`,
        );
      }

      const getDefaultPropertySettings = (props: PiecePropertyMap) => {
        return Object.fromEntries(
          Object.entries(props).map(([key, property]) => {
            const executionType = autoPropertiesUtils.determinePropertyExecutionType(key, property, props);
            return [
              key,
              {
                type: executionType,
              },
            ];
          }),
        );
      };
      
      return deepMergeAndCast<PieceTrigger>(
        {
          type: FlowTriggerType.PIECE,
          settings: overrideDefaultSettings ?? {
            pieceName: pieceSelectorItem.pieceMetadata.pieceName,
            triggerName: pieceSelectorItem.actionOrTrigger.name,
            pieceVersion: pieceSelectorItem.pieceMetadata.pieceVersion,
            input,
            propertySettings: getDefaultPropertySettings(pieceSelectorItem.actionOrTrigger.props),
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
export const pieceSelectorUtils = {
  getDefaultStepValues,
  useAdjustPieceListHeightToAvailableSpace,
  isMcpToolTrigger,
  isChatTrigger,
  removeHiddenActions,
};
