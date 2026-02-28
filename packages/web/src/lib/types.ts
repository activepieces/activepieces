import {
  ActionBase,
  ErrorHandlingOptionsParam,
  PieceAuthProperty,
  PieceMetadataModelSummary,
  TriggerBase,
} from '@activepieces/pieces-framework';
import {
  FlowActionKind,
  PackageType,
  PieceType,
  FlowTriggerKind,
  FlowOperationType,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

type BaseStepMetadata = {
  displayName: string;
  logoUrl: string;
  description: string;
};

export type PieceStepMetadata = BaseStepMetadata & {
  type: FlowActionKind.PIECE | FlowTriggerKind.PIECE;
  pieceName: string;
  pieceVersion: string;
  categories: string[];
  packageType: PackageType;
  pieceType: PieceType;
  auth: PieceAuthProperty | PieceAuthProperty[] | undefined;
  errorHandlingOptions?: ErrorHandlingOptionsParam;
};

export type PrimitiveStepMetadata = BaseStepMetadata & {
  type:
    | FlowActionKind.CODE
    | FlowActionKind.LOOP_ON_ITEMS
    | FlowActionKind.ROUTER
    | FlowTriggerKind.EMPTY;
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
  actionOrTriggerOrAgentDescription: string;
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

export type PieceSelectorPieceItem =
  | {
      actionOrTrigger: TriggerBase;
      type: FlowTriggerKind.PIECE;
      pieceMetadata: PieceStepMetadata;
    }
  | ({
      actionOrTrigger: ActionBase;
      type: FlowActionKind.PIECE;
      pieceMetadata: PieceStepMetadata;
    } & {
      auth?: PieceAuthProperty;
    });

export type PieceSelectorItem = PieceSelectorPieceItem | PrimitiveStepMetadata;

export type HandleSelectActionOrTrigger = (item: PieceSelectorItem) => void;

export enum RightSideBarType {
  NONE = 'none',
  PIECE_SETTINGS = 'piece-settings',
  VERSIONS = 'versions',
  RUNS = 'runs',
}

export enum ChatDrawerSource {
  TEST_FLOW = 'test-flow',
  TEST_STEP = 'test-step',
}
