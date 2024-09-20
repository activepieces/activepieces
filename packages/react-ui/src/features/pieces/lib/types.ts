import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
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
};

export type PrimitiveStepMetadata = BaseStepMetadata & {
  type: Omit<ActionType | TriggerType, ActionType.PIECE | TriggerType.PIECE>;
};

export type PieceStepMetadataWithSuggestions = PieceStepMetadata &
  Pick<PieceMetadataModelSummary, 'suggestedActions' | 'suggestedTriggers'>;

export type StepMetadataWithSuggestions =
  | PieceStepMetadataWithSuggestions
  | PrimitiveStepMetadata;

export type StepMetadata = PieceStepMetadata | PrimitiveStepMetadata;

export type ItemListMetadata = {
  name: string;
  displayName: string;
  description: string;
};

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

export type HandleSelectCallback = (
  piece: StepMetadata | undefined,
  item: ItemListMetadata,
) => void;
