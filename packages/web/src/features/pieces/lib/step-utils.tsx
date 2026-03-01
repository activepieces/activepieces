import {
  ErrorHandlingOptionsParam,
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  FlowActionKind,
  FlowNodeData,
  flowStructureUtil,
  LocalesEnum,
  spreadIfDefined,
  FlowTriggerKind,
  StepOutput,
  StepRunResponse,
} from '@activepieces/shared';
import { t } from 'i18next';

import {
  PieceStepMetadata,
  PrimitiveStepMetadata,
  StepMetadata,
  StepMetadataWithActionOrTriggerOrAgentDisplayName,
} from '../../../lib/types';

import { piecesApi } from './pieces-api';

export const CORE_STEP_METADATA: Record<
  Exclude<FlowActionKind, FlowActionKind.PIECE> | FlowTriggerKind.EMPTY,
  PrimitiveStepMetadata
> = {
  [FlowActionKind.CODE]: {
    displayName: t('Code'),
    logoUrl: 'https://cdn.activepieces.com/pieces/new-core/code.svg',
    description: t('Powerful Node.js & TypeScript code with npm'),
    type: FlowActionKind.CODE as const,
  },
  [FlowActionKind.LOOP_ON_ITEMS]: {
    displayName: t('Loop on Items'),
    logoUrl: 'https://cdn.activepieces.com/pieces/new-core/loop.svg',
    description: 'Iterate over a list of items',
    type: FlowActionKind.LOOP_ON_ITEMS as const,
  },
  [FlowActionKind.ROUTER]: {
    displayName: t('Router'),
    logoUrl: 'https://cdn.activepieces.com/pieces/new-core/router.svg',
    description: t('Split your flow into branches depending on condition(s)'),
    type: FlowActionKind.ROUTER as const,
  },
  [FlowTriggerKind.EMPTY]: {
    displayName: t('Empty Trigger'),
    logoUrl: 'https://cdn.activepieces.com/pieces/new-core/empty-trigger.svg',
    description: t('Empty Trigger'),
    type: FlowTriggerKind.EMPTY as const,
  },
} as const;
export const CORE_ACTIONS_METADATA = [
  CORE_STEP_METADATA[FlowActionKind.CODE],
  CORE_STEP_METADATA[FlowActionKind.LOOP_ON_ITEMS],
  CORE_STEP_METADATA[FlowActionKind.ROUTER],
] as const;

export const stepUtils = {
  getKeys(step: FlowNodeData, locale: LocalesEnum): (string | undefined)[] {
    const isPieceStep =
      step.kind === FlowActionKind.PIECE || step.kind === FlowTriggerKind.PIECE;
    const pieceName = isPieceStep ? step.settings.pieceName : undefined;
    const pieceVersion = isPieceStep ? step.settings.pieceVersion : undefined;
    const customLogoUrl = isPieceStep
      ? 'customLogoUrl' in step
        ? (step.customLogoUrl as string)
        : undefined
      : undefined;

    return [pieceName, pieceVersion, customLogoUrl, locale, step.kind];
  },
  async getMetadata(
    step: FlowNodeData,
    locale: LocalesEnum,
  ): Promise<StepMetadataWithActionOrTriggerOrAgentDisplayName> {
    const customLogoUrl =
      'customLogoUrl' in step ? step.customLogoUrl : undefined;
    switch (step.kind) {
      case FlowActionKind.ROUTER:
      case FlowActionKind.LOOP_ON_ITEMS:
      case FlowActionKind.CODE:
      case FlowTriggerKind.EMPTY:
        return {
          ...CORE_STEP_METADATA[step.kind],
          ...spreadIfDefined('logoUrl', customLogoUrl),
          actionOrTriggerOrAgentDisplayName: '',
          actionOrTriggerOrAgentDescription: '',
        };
      case FlowActionKind.PIECE:
      case FlowTriggerKind.PIECE: {
        const piece = await piecesApi.get({
          name: step.settings.pieceName,
          version: step.settings.pieceVersion,
          locale,
        });
        const metadata = stepUtils.mapPieceToMetadata({
          piece,
          type: step.kind === FlowActionKind.PIECE ? 'action' : 'trigger',
        });
        const actionOrTriggerDisplayName =
          step.kind === FlowActionKind.PIECE
            ? piece.actions[step.settings.actionName!].displayName
            : piece.triggers[step.settings.triggerName!].displayName;
        const actionOrTriggerDescription =
          step.kind === FlowActionKind.PIECE
            ? piece.actions[step.settings.actionName!].description
            : piece.triggers[step.settings.triggerName!].description;
        return {
          ...metadata,
          errorHandlingOptions: mapErrorHandlingOptions(piece, step),
          actionOrTriggerOrAgentDescription: actionOrTriggerDescription,
          actionOrTriggerOrAgentDisplayName: actionOrTriggerDisplayName,
        };
      }
    }
  },
  mapPieceToMetadata({
    piece,
    type,
  }: {
    piece: PieceMetadataModelSummary | PieceMetadataModel;
    type: 'action' | 'trigger';
  }): Omit<PieceStepMetadata, 'stepDisplayName'> {
    return {
      displayName: piece.displayName,
      logoUrl: piece.logoUrl,
      description: piece.description,
      type: type === 'action' ? FlowActionKind.PIECE : FlowTriggerKind.PIECE,
      pieceType: piece.pieceType,
      pieceName: piece.name,
      pieceVersion: piece.version,
      categories: piece.categories ?? [],
      packageType: piece.packageType,
      auth: piece.auth,
    };
  },
  getAgentRunId(output: StepOutput | StepRunResponse | undefined | null) {
    if (!output) {
      return undefined;
    }
    return 'output' in output &&
      'agentRunId' in (output.output as { agentRunId: string })
      ? (output.output as { agentRunId: string }).agentRunId
      : undefined;
  },
};

export function extractPieceNamesAndCoreMetadata(
  steps: ReturnType<typeof flowStructureUtil.getAllSteps>,
  excludeCore: boolean,
): { pieceNames: string[]; coreMetadata: StepMetadata[] } {
  const pieceNamesSet = new Set<string>();
  const coreMetadata: StepMetadata[] = [];

  for (const step of steps) {
    if (
      step.data.kind === FlowActionKind.PIECE ||
      step.data.kind === FlowTriggerKind.PIECE
    ) {
      pieceNamesSet.add(step.data.settings.pieceName);
    } else if (!excludeCore) {
      const coreMeta =
        CORE_STEP_METADATA[step.data.kind as keyof typeof CORE_STEP_METADATA];
      if (coreMeta) {
        coreMetadata.push(coreMeta);
      }
    }
  }

  return { pieceNames: Array.from(pieceNamesSet), coreMetadata };
}

function mapErrorHandlingOptions(
  piece: PieceMetadataModel,
  step: FlowNodeData,
): ErrorHandlingOptionsParam {
  if (flowStructureUtil.isTrigger(step.kind)) {
    return {
      continueOnFailure: {
        hide: true,
      },
      retryOnFailure: {
        hide: true,
      },
    };
  }
  const selectedAction =
    step.kind === FlowActionKind.PIECE
      ? piece.actions[step.settings.actionName!]
      : null;
  const errorHandlingOptions = selectedAction?.errorHandlingOptions;
  if (errorHandlingOptions) {
    return errorHandlingOptions;
  }
  return {
    continueOnFailure: {
      hide: false,
      defaultValue: false,
    },
    retryOnFailure: {
      hide: false,
      defaultValue: false,
    },
  };
}
