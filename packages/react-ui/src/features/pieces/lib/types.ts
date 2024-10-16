import {
  ActionBase,
  PieceAuthProperty,
  PieceMetadataModelSummary,
  TriggerBase,
} from '@activepieces/pieces-framework';
import {
  ActionType,
  PackageType,
  PieceType,
  TriggerType,
  FlowOperationType,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

type BaseStepMetadata = {
  displayName: string;
  logoUrl: string;
  description: string;
};

export type PieceStepMetadata = BaseStepMetadata & {
  type: ActionType.PIECE | TriggerType.PIECE;
  pieceName: string;
  pieceVersion: string;
  categories: string[];
  packageType: PackageType;
  pieceType: PieceType;
  auth: PieceAuthProperty | undefined;
};

type PrimitiveStepMetadata = BaseStepMetadata & {
  type:
    | ActionType.BRANCH
    | ActionType.CODE
    | ActionType.LOOP_ON_ITEMS
    | TriggerType.EMPTY;
};

export type PieceStepMetadataWithSuggestions = PieceStepMetadata &
  Pick<PieceMetadataModelSummary, 'suggestedActions' | 'suggestedTriggers'>;

export type StepMetadataWithSuggestions =
  | PieceStepMetadataWithSuggestions
  | PrimitiveStepMetadata;

export type StepMetadata = PieceStepMetadata | PrimitiveStepMetadata;

export type PieceSelectorOperation =
  | {
      type: FlowOperationType.ADD_ACTION;
      actionLocation: {
        parentStep: string;
        stepLocationRelativeToParent: StepLocationRelativeToParent;
      };
    }
  | { type: FlowOperationType.UPDATE_TRIGGER }
  | {
      type: FlowOperationType.UPDATE_ACTION;
      stepName: string;
    };

export type PieceSelectorItem =
  | ActionBase
  | TriggerBase
  | {
      displayName: string;
      name: string;
      type: ActionType.LOOP_ON_ITEMS | ActionType.BRANCH | ActionType.CODE;
      description: string;
    };

export type HandleSelectCallback = (
  piece: StepMetadata,
  item: PieceSelectorItem,
) => void;
