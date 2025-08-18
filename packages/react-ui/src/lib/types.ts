import {
  ActionBase,
  ErrorHandlingOptionsParam,
  PieceAuthProperty,
  PieceMetadataModelSummary,
  TriggerBase,
} from '@activepieces/pieces-framework';
import {
  FlowActionType,
  PackageType,
  PieceType,
  FlowTriggerType,
  FlowOperationType,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

type BaseStepMetadata = {
  displayName: string;
  logoUrl: string;
  description: string;
};

export type PieceStepMetadata = BaseStepMetadata & {
  type: FlowActionType.PIECE | FlowTriggerType.PIECE;
  pieceName: string;
  pieceVersion: string;
  categories: string[];
  packageType: PackageType;
  pieceType: PieceType;
  auth: PieceAuthProperty | undefined;
  errorHandlingOptions?: ErrorHandlingOptionsParam;
};

export type PrimitiveStepMetadata = BaseStepMetadata & {
  type:
    | FlowActionType.CODE
    | FlowActionType.LOOP_ON_ITEMS
    | FlowActionType.ROUTER
    | FlowTriggerType.EMPTY;
};

export type PieceStepMetadataWithSuggestions = PieceStepMetadata &
  Pick<PieceMetadataModelSummary, 'suggestedActions' | 'suggestedTriggers'>;

export type StepMetadataWithSuggestions =
  | PieceStepMetadataWithSuggestions
  | PrimitiveStepMetadata;

export type CategorizedStepMetadataWithSuggestions = {
  title: string;
  metadata: StepMetadataWithSuggestions[];
};

export type StepMetadata = PieceStepMetadata | PrimitiveStepMetadata;

export type StepMetadataWithActionOrTriggerOrAgentDisplayName = StepMetadata & {
  actionOrTriggerOrAgentDisplayName: string;
};

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

export type AskAiButtonOperations = Exclude<
  PieceSelectorOperation,
  { type: FlowOperationType.UPDATE_TRIGGER }
>;

export type PieceSelectorPieceItem =
  | {
      actionOrTrigger: TriggerBase;
      type: FlowTriggerType.PIECE;
      pieceMetadata: PieceStepMetadata;
    }
  | ({
      actionOrTrigger: ActionBase;
      type: FlowActionType.PIECE;
      pieceMetadata: PieceStepMetadata;
    } & {
      auth?: PieceAuthProperty;
    });

export type PieceSelectorItem = PieceSelectorPieceItem | PrimitiveStepMetadata;

export type HandleSelectActionOrTrigger = (item: PieceSelectorItem) => void;
