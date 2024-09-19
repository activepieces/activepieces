import {
  PieceStepMetadata,
  StepMetadata,
} from '@/features/pieces/lib/pieces-hook';
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
  flowHelper,
  PieceCategory,
} from '@activepieces/shared';

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
  const baseName = 'step_';
  let number = 1;
  const steps = flowHelper.getAllSteps(flowVersion.trigger);
  while (steps.some((step) => step.name === `${baseName}${number}`)) {
    number++;
  }
  return `${baseName}${number}`;
};

const isAiPiece = (piece: StepMetadata) =>
  piece.type === TriggerType.PIECE || piece.type === ActionType.PIECE
    ? (piece as PieceStepMetadata).categories.includes(
        PieceCategory.ARTIFICIAL_INTELLIGENCE,
      )
    : false;

const isAppPiece = (piece: StepMetadata) =>
  !isAiPiece(piece) && !isCorePiece(piece);

const getDefaultStep = ({
  stepName,
  piece,
  actionOrTriggerName,
  displayName,
}: {
  stepName: string;
  piece: StepMetadata;
  displayName: string;
  actionOrTriggerName?: string;
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
  const common = {
    name: stepName,
    valid:
      piece.type === ActionType.CODE || piece.type === ActionType.LOOP_ON_ITEMS,
    displayName: displayName,
    settings: {
      inputUiInfo: {
        customizedInputs: {},
      },
    },
  };

  switch (piece.type) {
    case ActionType.CODE:
      return deepMergeAndCast<CodeAction>(
        {
          type: ActionType.CODE,
          settings: {
            sourceCode: {
              code: defaultCode,
              packageJson: '{}',
            },
            input: {},
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
    case ActionType.BRANCH:
      return deepMergeAndCast<Action>(
        {
          type: ActionType.BRANCH,
          settings: {
            conditions: [
              [
                {
                  firstValue: '',
                  operator: BranchOperator.TEXT_CONTAINS,
                  secondValue: '',
                  caseSensitive: false,
                },
              ],
            ],
          },
        },
        common,
      );
    case ActionType.PIECE: {
      const pieceStepMetadata = piece as PieceStepMetadata;
      return deepMergeAndCast<PieceAction>(
        {
          type: ActionType.PIECE,
          settings: {
            pieceName: pieceStepMetadata.pieceName,
            pieceType: pieceStepMetadata.pieceType,
            packageType: pieceStepMetadata.packageType,
            actionName: actionOrTriggerName,
            pieceVersion: pieceStepMetadata.pieceVersion,
            input: {},
            errorHandlingOptions: errorHandlingOptions,
          },
        },
        common,
      );
    }
    case TriggerType.PIECE: {
      const pieceStepMetadata = piece as PieceStepMetadata;
      return deepMergeAndCast<PieceTrigger>(
        {
          type: TriggerType.PIECE,
          settings: {
            pieceName: pieceStepMetadata.pieceName,
            pieceType: pieceStepMetadata.pieceType,
            packageType: pieceStepMetadata.packageType,
            triggerName: actionOrTriggerName,
            pieceVersion: pieceStepMetadata.pieceVersion,
            input: {},
          },
        },
        common,
      );
    }
    default:
      throw new Error('Unsupported type: ' + piece.type);
  }
};

export const pieceSelectorUtils = {
  getDefaultStep,
  isCorePiece,
  getStepName,
  isAiPiece,
  isAppPiece,
  toKey,
};
