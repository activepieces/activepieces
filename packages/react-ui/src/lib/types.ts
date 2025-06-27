import { t } from 'i18next';

import {
  ActionBase,
  ErrorHandlingOptionsParam,
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
  errorHandlingOptions?: ErrorHandlingOptionsParam;
};

export type PrimitiveStepMetadata = BaseStepMetadata & {
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

export type CategorizedStepMetadataWithSuggestions = {
  title: string;
  metadata: StepMetadataWithSuggestions[];
};

export type StepMetadata = PieceStepMetadata | PrimitiveStepMetadata;

export type StepMetadataWithStepName = StepMetadata & {
  stepDisplayName: string;
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
      type: TriggerType.PIECE;
      pieceMetadata: PieceStepMetadata;
    }
  | ({
      actionOrTrigger: ActionBase;
      type: ActionType.PIECE;
      pieceMetadata: PieceStepMetadata;
    } & {
      auth?: PieceAuthProperty;
    });

export type PieceSelectorItem = PieceSelectorPieceItem | PrimitiveStepMetadata;

export type HandleSelectActionOrTrigger = (item: PieceSelectorItem) => void;

export enum PieceTagType {
  CORE = 'CORE',
  AI_AND_AGENTS = 'AI_AND_AGENTS',
  APPS = 'APPS',
  ALL = 'ALL',
}

export type PieceTag = {
  title: string;
  logoUrl: string;
  description: string;
} & (
  | {
      type: PieceTagType.CORE | PieceTagType.AI_AND_AGENTS | PieceTagType.APPS;
    }
  | {
      type: PieceTagType.ALL;
      stepMetadata: StepMetadataWithSuggestions;
    }
);

export const tagCategoryName = {
  [PieceTagType.CORE]: t('Core'),
  [PieceTagType.AI_AND_AGENTS]: t('AI and Agents'),
  [PieceTagType.APPS]: t('Popular'),
} as const;
