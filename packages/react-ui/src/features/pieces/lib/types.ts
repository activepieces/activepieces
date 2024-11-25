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
    | ActionType.CODE
    | ActionType.LOOP_ON_ITEMS
    | ActionType.ROUTER
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
        branchIndex: number;
        parentStep: string;
        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
      };
    }
  | {
      type: FlowOperationType.ADD_ACTION;
      actionLocation: {
        parentStep: string;
        stepLocationRelativeToParent: Exclude<
          StepLocationRelativeToParent,
          StepLocationRelativeToParent.INSIDE_BRANCH
        >;
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
      type: ActionType.LOOP_ON_ITEMS | ActionType.ROUTER | ActionType.CODE;
      description: string;
    };

export type HandleSelectCallback = (
  piece: StepMetadata,
  item: PieceSelectorItem,
) => void;
