import { useRef } from 'react';

import {
  PieceSelectorItem,
  PieceStepMetadata,
  StepMetadata,
  StepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import {
  ActionBase,
  PiecePropertyMap,
  PropertyType,
  TriggerBase,
} from '@activepieces/pieces-framework';
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
  PieceCategory,
  BranchExecutionType,
  RouterExecutionType,
  spreadIfDefined,
  isNil,
  PlatformWithoutSensitiveData,
} from '@activepieces/shared';

import { formUtils } from '../piece-properties/form-utils';

const defaultCode = `export const code = async (inputs) => {
  return true;
};`;

function toKey(stepMetadata: StepMetadata): string {
  switch (stepMetadata.type) {
    case ActionType.PIECE:
    case TriggerType.PIECE: {
      const pieceMetadata: PieceStepMetadata = stepMetadata;
      return `${stepMetadata.type}-${pieceMetadata.pieceName}-${pieceMetadata.pieceVersion}`;
    }
    default:
      return stepMetadata.type.toLowerCase();
  }
}

const isCorePiece = (piece: StepMetadata) =>
  piece.type !== TriggerType.PIECE && piece.type !== ActionType.PIECE
    ? true
    : (piece as PieceStepMetadata).categories.includes(PieceCategory.CORE);

const isAiPiece = (piece: StepMetadata) =>
  piece.type === TriggerType.PIECE || piece.type === ActionType.PIECE
    ? piece.categories.includes(PieceCategory.ARTIFICIAL_INTELLIGENCE)
    : false;

const isAppPiece = (piece: StepMetadata) =>
  !isAiPiece(piece) && !isCorePiece(piece);

const isPopularPieces = (
  stepMetadata: StepMetadataWithSuggestions,
  platform: PlatformWithoutSensitiveData,
) => {
  if (
    stepMetadata.type !== TriggerType.PIECE &&
    stepMetadata.type !== ActionType.PIECE
  ) {
    return false;
  }
  const popularPieces = [
    '@activepieces/piece-gmail',
    '@activepieces/piece-google-sheets',
    '@activepieces/piece-openai',
    '@activepieces/piece-schedule',
    '@activepieces/piece-webhook',
    '@activepieces/piece-http',
    '@activepieces/piece-forms',
    '@activepieces/piece-slack',
  ];
  const pinnedPieces = platform.pinnedPieces ?? [];
  return [...popularPieces, ...pinnedPieces].includes(
    (stepMetadata as PieceStepMetadata).pieceName,
  );
};

const isFlowController = (stepMetadata: StepMetadata) => {
  if (stepMetadata.type === ActionType.PIECE) {
    return stepMetadata.categories.includes(PieceCategory.FLOW_CONTROL);
  }
  return [ActionType.LOOP_ON_ITEMS, ActionType.ROUTER].includes(
    stepMetadata.type as ActionType,
  );
};

const isUniversalAiPiece = (stepMetadata: StepMetadata) => {
  if (stepMetadata.type === ActionType.PIECE) {
    return stepMetadata.categories.includes(PieceCategory.UNIVERSAL_AI);
  }
  return false;
};

const isPieceActionOrTrigger = (
  pieceSelectorItem: PieceSelectorItem,
): pieceSelectorItem is TriggerBase | ActionBase => {
  return !('type' in pieceSelectorItem);
};

const isStepInitiallyValid = (
  stepMetadata: StepMetadata,
  actionOrTrigger: PieceSelectorItem,
) => {
  switch (stepMetadata.type) {
    case ActionType.CODE:
      return true;
    case ActionType.PIECE:
    case TriggerType.PIECE: {
      const isPieceStep = isPieceActionOrTrigger(actionOrTrigger);
      if (!isPieceStep) {
        console.error('Invalid piece selector item', actionOrTrigger);
        return false;
      }
      const inputValidity = checkPieceInputValidity(
        getInitalStepInput(stepMetadata, actionOrTrigger),
        actionOrTrigger.props,
      );
      return inputValidity && !actionOrTrigger.requireAuth;
    }
    case ActionType.LOOP_ON_ITEMS:
    case ActionType.ROUTER:
    case TriggerType.EMPTY:
      return false;
  }
};

const getInitalStepInput = (
  stepMetadata: StepMetadata,
  actionOrTrigger: PieceSelectorItem,
) => {
  const isPieceStep = isPieceActionOrTrigger(actionOrTrigger);
  if (!isPieceStep) {
    return {};
  }
  return formUtils.getDefaultValueForStep(
    {
      ...spreadIfDefined('auth', stepMetadata.auth),
      ...actionOrTrigger.props,
    },
    {},
  );
};

const getDefaultStep = ({
  stepName,
  stepMetadata,
  actionOrTrigger,
  settings,
}: {
  stepName: string;
  stepMetadata: StepMetadata;
  actionOrTrigger: PieceSelectorItem;
  settings?: Record<string, unknown>;
}): Action | Trigger => {
  const errorHandlingOptions: CodeAction['settings']['errorHandlingOptions'] = {
    continueOnFailure: {
      value: false,
    },
    retryOnFailure: {
      value: false,
    },
  };

  const input = getInitalStepInput(stepMetadata, actionOrTrigger);
  const isValid = isStepInitiallyValid(stepMetadata, actionOrTrigger);
  const common = {
    name: stepName,
    valid: isValid,
    displayName: actionOrTrigger.displayName,
    skip: false,
    settings: {
      inputUiInfo: {
        customizedInputs: {},
      },
    },
  };

  switch (stepMetadata.type) {
    case ActionType.CODE:
      return deepMergeAndCast<CodeAction>(
        {
          type: ActionType.CODE,
          settings: settings ?? {
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
          settings: settings ?? {
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
          settings: settings ?? {
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
      return deepMergeAndCast<PieceAction>(
        {
          type: ActionType.PIECE,
          settings: settings ?? {
            pieceName: stepMetadata.pieceName,
            pieceType: stepMetadata.pieceType,
            packageType: stepMetadata.packageType,
            actionName: actionOrTrigger.name,
            pieceVersion: stepMetadata.pieceVersion,
            input,
            errorHandlingOptions,
          },
        },
        common,
      );
    }
    case TriggerType.PIECE: {
      return deepMergeAndCast<PieceTrigger>(
        {
          type: TriggerType.PIECE,
          settings: settings ?? {
            pieceName: stepMetadata.pieceName,
            pieceType: stepMetadata.pieceType,
            packageType: stepMetadata.packageType,
            triggerName: actionOrTrigger.name,
            pieceVersion: stepMetadata.pieceVersion,
            input,
          },
        },
        common,
      );
    }
    default:
      throw new Error('Unsupported type: ' + stepMetadata.type);
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

const maxListHeight = 300;
const minListHeight = 100;

const useAdjustPieceListHeightToAvailableSpace = (
  isPieceSelectorOpen: boolean,
) => {
  const listHeightRef = useRef<number>(maxListHeight);
  const popoverTriggerRef = useRef<HTMLButtonElement | null>(null);
  const previousOpenValueRef = useRef<boolean>(isPieceSelectorOpen);
  if (
    !previousOpenValueRef.current &&
    isPieceSelectorOpen &&
    popoverTriggerRef.current
  ) {
    const popoverTriggerRect =
      popoverTriggerRef.current.getBoundingClientRect();
    const popOverFullHeight = maxListHeight;
    const isRenderingPopoverBelowTrigger =
      popoverTriggerRect.top <
      (window.innerHeight || document.documentElement.clientHeight) -
        popoverTriggerRect.bottom;
    if (isRenderingPopoverBelowTrigger) {
      const isPopoverOverflowing =
        popoverTriggerRect.bottom + popOverFullHeight >
        (window.innerHeight || document.documentElement.clientHeight);
      if (isPopoverOverflowing) {
        listHeightRef.current = Math.max(
          minListHeight,
          maxListHeight +
            (window.innerHeight || document.documentElement.clientHeight) -
            popOverFullHeight -
            popoverTriggerRect.bottom,
        );
      }
    } else {
      const isPopoverOverflowing =
        popoverTriggerRect.top - popOverFullHeight < 0;
      if (isPopoverOverflowing) {
        listHeightRef.current = Math.max(
          minListHeight,
          maxListHeight - Math.abs(popoverTriggerRect.top - popOverFullHeight),
        );
      }
    }
  }
  previousOpenValueRef.current = isPieceSelectorOpen;
  return {
    listHeightRef,
    popoverTriggerRef,
    maxListHeight,
  };
};

export const pieceSelectorUtils = {
  getDefaultStep,
  isCorePiece,
  isAiPiece,
  isAppPiece,
  toKey,
  isPopularPieces,
  isFlowController,
  isUniversalAiPiece,
  useAdjustPieceListHeightToAvailableSpace,
};
