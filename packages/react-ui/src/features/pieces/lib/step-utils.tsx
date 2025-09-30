import { t } from 'i18next';

import { agentsApi } from '@/features/agents/lib/agents-api';
import {
  ErrorHandlingOptionsParam,
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  FlowAction,
  FlowActionType,
  flowStructureUtil,
  LocalesEnum,
  spreadIfDefined,
  Step,
  FlowTriggerType,
  FlowTrigger,
  StepOutput,
  StepRunResponse,
} from '@activepieces/shared';

import {
  PieceStepMetadata,
  PrimitiveStepMetadata,
  StepMetadata,
  StepMetadataWithActionOrTriggerOrAgentDisplayName,
} from '../../../lib/types';

import { piecesApi } from './pieces-api';

export const CORE_STEP_METADATA: Record<
  Exclude<FlowActionType, FlowActionType.PIECE> | FlowTriggerType.EMPTY,
  PrimitiveStepMetadata
> = {
  [FlowActionType.CODE]: {
    displayName: t('Code'),
    logoUrl: 'https://cdn.activepieces.com/pieces/code.svg',
    description: t('Powerful Node.js & TypeScript code with npm'),
    type: FlowActionType.CODE as const,
  },
  [FlowActionType.LOOP_ON_ITEMS]: {
    displayName: t('Loop on Items'),
    logoUrl: 'https://cdn.activepieces.com/pieces/loop.svg',
    description: 'Iterate over a list of items',
    type: FlowActionType.LOOP_ON_ITEMS as const,
  },
  [FlowActionType.ROUTER]: {
    displayName: t('Router'),
    logoUrl: 'https://cdn.activepieces.com/pieces/branch.svg',
    description: t('Split your flow into branches depending on condition(s)'),
    type: FlowActionType.ROUTER as const,
  },
  [FlowTriggerType.EMPTY]: {
    displayName: t('Empty Trigger'),
    logoUrl: 'https://cdn.activepieces.com/pieces/empty-trigger.svg',
    description: t('Empty Trigger'),
    type: FlowTriggerType.EMPTY as const,
  },
} as const;
export const CORE_ACTIONS_METADATA = [
  CORE_STEP_METADATA[FlowActionType.CODE],
  CORE_STEP_METADATA[FlowActionType.LOOP_ON_ITEMS],
  CORE_STEP_METADATA[FlowActionType.ROUTER],
] as const;

export const TODO_ACTIONS = {
  createTodo: 'createTodo',
  createTodoAndWait: 'createTodoAndWait',
  waitForApproval: 'wait_for_approval',
};

export const HIDDEN_ACTIONS = [
  {
    pieceName: '@activepieces/piece-todos',
    actions: [TODO_ACTIONS.createTodoAndWait, TODO_ACTIONS.waitForApproval],
  },
];

export const stepUtils = {
  getKeys(
    step: FlowAction | FlowTrigger,
    locale: LocalesEnum,
  ): (string | undefined)[] {
    const isPieceStep =
      step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE;
    const pieceName = isPieceStep ? step.settings.pieceName : undefined;
    const pieceVersion = isPieceStep ? step.settings.pieceVersion : undefined;
    const customLogoUrl = isPieceStep
      ? 'customLogoUrl' in step
        ? step.customLogoUrl
        : undefined
      : undefined;
    const agentId = flowStructureUtil.getExternalAgentId(step);
    return [pieceName, pieceVersion, customLogoUrl, agentId, locale, step.type];
  },
  async getMetadata(
    step: FlowAction | FlowTrigger,
    locale: LocalesEnum,
  ): Promise<StepMetadataWithActionOrTriggerOrAgentDisplayName> {
    const customLogoUrl =
      'customLogoUrl' in step ? step.customLogoUrl : undefined;
    switch (step.type) {
      case FlowActionType.ROUTER:
      case FlowActionType.LOOP_ON_ITEMS:
      case FlowActionType.CODE:
      case FlowTriggerType.EMPTY:
        return {
          ...CORE_STEP_METADATA[step.type],
          ...spreadIfDefined('logoUrl', customLogoUrl),
          actionOrTriggerOrAgentDisplayName: '',
        };
      case FlowActionType.PIECE:
      case FlowTriggerType.PIECE: {
        const piece = await piecesApi.get({
          name: step.settings.pieceName,
          version: step.settings.pieceVersion,
          locale,
        });
        const metadata = stepUtils.mapPieceToMetadata({
          piece,
          type: step.type === FlowActionType.PIECE ? 'action' : 'trigger',
        });
        const agentMetadata = await getAgentMetadata(step);
        const agentDisplayName = agentMetadata.displayName;
        const actionOrTriggerDisplayName =
          step.type === FlowActionType.PIECE
            ? piece.actions[step.settings.actionName!].displayName
            : piece.triggers[step.settings.triggerName!].displayName;
        return {
          ...metadata,
          ...spreadIfDefined('logoUrl', agentMetadata.logoUrl ?? customLogoUrl),
          ...spreadIfDefined(
            'description',
            agentMetadata.description ?? piece.description,
          ),
          errorHandlingOptions: mapErrorHandlingOptions(piece, step),
          actionOrTriggerOrAgentDisplayName:
            agentDisplayName ?? actionOrTriggerDisplayName,
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
      type: type === 'action' ? FlowActionType.PIECE : FlowTriggerType.PIECE,
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

async function getAgentMetadata(
  step: FlowAction | FlowTrigger,
): Promise<
  Partial<Pick<StepMetadata, 'displayName' | 'logoUrl' | 'description'>>
> {
  if (flowStructureUtil.isAgentPiece(step)) {
    const externalAgentId = flowStructureUtil.getExternalAgentId(step);
    if (!externalAgentId) {
      return {};
    }
    const agent = await agentsApi.findByExteranlId(externalAgentId);
    if (!agent) {
      return {};
    }
    return {
      logoUrl: agent.profilePictureUrl,
      description: agent.description,
      displayName: agent.displayName,
    };
  }
  return {};
}

function mapErrorHandlingOptions(
  piece: PieceMetadataModel,
  step: Step,
): ErrorHandlingOptionsParam {
  if (flowStructureUtil.isTrigger(step.type)) {
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
    step.type === FlowActionType.PIECE
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
