import { PieceStepMetadata, StepMetadata } from "@/features/pieces/lib/pieces-hook";
import { Action, ActionType, BranchOperator, CodeAction, PieceAction, PieceTrigger, Trigger, TriggerType, deepMergeAndCast } from "@activepieces/shared";

const defaultCode = `export const code = async (inputs) => {
  return true;
};`

export const pieceSelectorUtils = {
  getDefaultStep(stepName: string, piece: StepMetadata): Action | Trigger {
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
      valid: false,
      displayName: piece.displayName,
      settings: {
        inputUiInfo: {
          customizedInputs: {}
        }
      }
    }
    switch (piece.type) {
      case ActionType.CODE:
        return deepMergeAndCast<CodeAction>({
          type: ActionType.CODE,
          settings: {
            sourceCode: {
              code: defaultCode,
              packageJson: '{}',
            },
            input: {},
            inputUiInfo: {
              customizedInputs: {}
            },
            errorHandlingOptions: errorHandlingOptions,
          },
        }, common);
      case ActionType.LOOP_ON_ITEMS:
        return deepMergeAndCast<Action>({
          type: ActionType.LOOP_ON_ITEMS,
          settings: {
            items: '',
            inputUiInfo: {
              customizedInputs: {}
            },
          },
        }, common);
      case ActionType.BRANCH:
        return deepMergeAndCast<Action>({
          type: ActionType.BRANCH,
          settings: {
            conditions: [[{ firstValue: '', operator: BranchOperator.TEXT_CONTAINS, secondValue: '', caseSensitive: false }]],
          },
        }, common);
      case ActionType.PIECE: {
        // TODO add default values
        const pieceStepmetadta = piece as PieceStepMetadata;
        return deepMergeAndCast<PieceAction>({
          type: ActionType.PIECE,
          settings: {
            pieceName: pieceStepmetadta.pieceName,
            pieceType: pieceStepmetadta.pieceType,
            packageType: pieceStepmetadta.packageType,
            actionName: undefined,
            pieceVersion: pieceStepmetadta.pieceVersion,
            input: {},
            errorHandlingOptions: errorHandlingOptions,
          },
        }, common)
      }
      case TriggerType.PIECE: {
        const pieceStepmetadta = piece as PieceStepMetadata;
        return deepMergeAndCast<PieceTrigger>({
          type: TriggerType.PIECE,
          settings: {
            pieceName: pieceStepmetadta.pieceName,
            pieceType: pieceStepmetadta.pieceType,
            packageType: pieceStepmetadta.packageType,
            triggerName: '',
            pieceVersion: pieceStepmetadta.pieceVersion,
            input: {},
          },
        }, common)
      }
      default:
        throw new Error('Unsupported type: ' + piece.type);
    }
  }
}