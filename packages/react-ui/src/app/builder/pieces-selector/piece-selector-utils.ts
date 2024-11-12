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
  FlowVersion,
  PieceCategory,
  BranchExecutionType,
  RouterExecutionType,
  spreadIfDefined,
  isNil,
  Platform,
  flowStructureUtil,
} from '@activepieces/shared';

import { formUtils } from '../piece-properties/form-utils';

const defaultCode = `export const code = async (inputs) => {
  return true;
};`;

function toKey(stepMetadata: StepMetadata): string {
  switch (stepMetadata.type) {
    case ActionType.PIECE:
    case TriggerType.PIECE: {
      const pieceMetadata: PieceStepMetadata =
        stepMetadata as PieceStepMetadata;
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

const getStepName = (piece: StepMetadata, flowVersion: FlowVersion) => {
  if (piece.type === TriggerType.PIECE) {
    return 'trigger';
  }
  return flowStructureUtil.findUnusedName(flowVersion.trigger);
};

const isAiPiece = (piece: StepMetadata) =>
  piece.type === TriggerType.PIECE || piece.type === ActionType.PIECE
    ? (piece as PieceStepMetadata).categories.includes(
        PieceCategory.ARTIFICIAL_INTELLIGENCE,
      )
    : false;

const isAppPiece = (piece: StepMetadata) =>
  !isAiPiece(piece) && !isCorePiece(piece);

const isActionOrTrigger = (
  item: PieceSelectorItem,
  stepMetadata: StepMetadata,
): item is ActionBase | TriggerBase => {
  return [ActionType.PIECE, TriggerType.PIECE].includes(stepMetadata.type);
};

const isPieceStepMetadata = (
  stepMetadata: StepMetadata,
): stepMetadata is PieceStepMetadata => {
  return [ActionType.PIECE, TriggerType.PIECE].includes(stepMetadata.type);
};

const isPopularPieces = (
  stepMetadata: StepMetadataWithSuggestions,
  platform: Platform,
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
    return (stepMetadata as PieceStepMetadata).categories.includes(
      PieceCategory.FLOW_CONTROL,
    );
  }
  return [ActionType.LOOP_ON_ITEMS, ActionType.ROUTER].includes(
    stepMetadata.type as ActionType,
  );
};

const isUniversalAiPiece = (stepMetadata: StepMetadata) => {
  if (stepMetadata.type === ActionType.PIECE) {
    return (stepMetadata as PieceStepMetadata).categories.includes(
      PieceCategory.UNIVERSAL_AI,
    );
  }
  return false;
};

const isUtilityCorePiece = (stepMetadata: StepMetadata, platform: Platform) => {
  if (stepMetadata.type === ActionType.CODE) {
    return true;
  }
  if (!isCorePiece(stepMetadata)) {
    return false;
  }
  return (
    !isFlowController(stepMetadata) && !isPopularPieces(stepMetadata, platform)
  );
};

const getDefaultStep = ({
  stepName,
  stepMetadata,
  actionOrTrigger,
}: {
  stepName: string;
  stepMetadata: StepMetadata;
  actionOrTrigger: PieceSelectorItem;
}): Action | Trigger => {
  const errorHandlingOptions = {
    continueOnFailure: {
      hide: true,
      value: false,
    },
    retryOnFailure: {
      hide: true,
      value: false,
    },
  };
  const isPieceStep =
    isActionOrTrigger(actionOrTrigger, stepMetadata) &&
    isPieceStepMetadata(stepMetadata);
  const input = isPieceStep
    ? formUtils.getDefaultValueForStep(
        actionOrTrigger.requireAuth
          ? {
              ...spreadIfDefined('auth', stepMetadata.auth),
              ...actionOrTrigger.props,
            }
          : actionOrTrigger.props,
        {},
      )
    : {};

  const common = {
    name: stepName,
    valid: isPieceStep
      ? checkPieceInputValidity(input, actionOrTrigger.props) &&
        (actionOrTrigger.requireAuth ? !isNil(input['auth']) : true)
      : stepMetadata.type === ActionType.CODE
      ? true
      : false,
    displayName: actionOrTrigger.displayName,
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
          settings: {
            sourceCode: {
              code: defaultCode,
              packageJson: '{}',
            },
            input,
            inputUiInfo: {
              customizedInputs: {},
            },
            errorHandlingOptions: errorHandlingOptions,
          },
        },
        common,
      );
    case ActionType.LOOP_ON_ITEMS:
      return deepMergeAndCast<Action>(
        {
          type: ActionType.LOOP_ON_ITEMS,
          settings: {
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
          settings: {
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
          settings: {
            pieceName: stepMetadata.pieceName,
            pieceType: stepMetadata.pieceType,
            packageType: stepMetadata.packageType,
            actionName: actionOrTrigger.name,
            pieceVersion: stepMetadata.pieceVersion,
            input,
            errorHandlingOptions: errorHandlingOptions,
          },
        },
        common,
      );
    }
    case TriggerType.PIECE: {
      return deepMergeAndCast<PieceTrigger>(
        {
          type: TriggerType.PIECE,
          settings: {
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
const aboveListSectionHeight = 86;

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
    const popOverFullHeight = maxListHeight + aboveListSectionHeight;
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
    aboveListSectionHeight,
  };
};

export const pieceSelectorUtils = {
  getDefaultStep,
  isCorePiece,
  getStepName,
  isAiPiece,
  isAppPiece,
  toKey,
  isPopularPieces,
  isUtilityCorePiece,
  isFlowController,
  isUniversalAiPiece,
  useAdjustPieceListHeightToAvailableSpace,
};
