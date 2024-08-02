import { PieceStepMetadata, StepMetadata } from "@/features/pieces/lib/pieces-hook";
import { Action, ActionType, BranchOperator, CodeAction, PieceAction, TriggerType, deepMergeAndCast } from "@activepieces/shared";

const defaultCode = `export const code = async (inputs) => {
  return true;
};`

export const pieceSelectorUtils = {
  getDefaultAction(stepName: string, piece: StepMetadata): Action {
    const common = {
      name: stepName,
      valid: false,
      displayName: piece.displayName,
      settings: {
        inputUiInfo: {
          customizedInputs: {}
        },
        errorHandlingOptions: {
          continueOnFailure: {
            value: false,
          },
          retryOnFailure: {
            value: false,
          },
        },
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
          },
        }, common)
      }
      case TriggerType.PIECE: {
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
          },
        }, common)
      }
      default:
        throw new Error('Unsupported type: ' + piece.type);
    }
  }
}