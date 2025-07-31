import { t } from 'i18next';

import { agentsApi } from '@/features/agents/lib/agents-api';
import {
  ErrorHandlingOptionsParam,
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  Action,
  ActionType,
  flowStructureUtil,
  LocalesEnum,
  spreadIfDefined,
  Step,
  TriggerType,
  Trigger,
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
  Exclude<ActionType, ActionType.PIECE> | TriggerType.EMPTY,
  PrimitiveStepMetadata
> = {
  [ActionType.CODE]: {
    displayName: t('Code'),
    logoUrl: 'https://cdn.activepieces.com/pieces/code.svg',
    description: t('Powerful Node.js & TypeScript code with npm'),
    type: ActionType.CODE as const,
  },
  [ActionType.LOOP_ON_ITEMS]: {
    displayName: t('Loop on Items'),
    logoUrl: 'https://cdn.activepieces.com/pieces/loop.svg',
    description: 'Iterate over a list of items',
    type: ActionType.LOOP_ON_ITEMS as const,
  },
  [ActionType.ROUTER]: {
    displayName: t('Router'),
    logoUrl: 'https://cdn.activepieces.com/pieces/branch.svg',
    description: t('Split your flow into branches depending on condition(s)'),
    type: ActionType.ROUTER as const,
  },
  [TriggerType.EMPTY]: {
    displayName: t('Empty Trigger'),
    logoUrl: 'https://cdn.activepieces.com/pieces/empty-trigger.svg',
    description: t('Empty Trigger'),
    type: TriggerType.EMPTY as const,
  },
} as const;
export const CORE_ACTIONS_METADATA = [
  CORE_STEP_METADATA[ActionType.CODE],
  CORE_STEP_METADATA[ActionType.LOOP_ON_ITEMS],
  CORE_STEP_METADATA[ActionType.ROUTER],
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
  getKeys(step: Action | Trigger, locale: LocalesEnum): (string | undefined)[] {
    const isPieceStep =
      step.type === ActionType.PIECE || step.type === TriggerType.PIECE;
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
    step: Action | Trigger,
    locale: LocalesEnum,
  ): Promise<StepMetadataWithActionOrTriggerOrAgentDisplayName> {
    const customLogoUrl =
      'customLogoUrl' in step ? step.customLogoUrl : undefined;
    switch (step.type) {
      case ActionType.ROUTER:
      case ActionType.LOOP_ON_ITEMS:
      case ActionType.CODE:
      case TriggerType.EMPTY:
        return {
          ...CORE_STEP_METADATA[step.type],
          ...spreadIfDefined('logoUrl', customLogoUrl),
          actionOrTriggerOrAgentDisplayName: '',
        };
      case ActionType.PIECE:
      case TriggerType.PIECE: {
        const piece = await piecesApi.get({
          name: step.settings.pieceName,
          version: step.settings.pieceVersion,
          locale: locale,
        });
        const metadata = stepUtils.mapPieceToMetadata({
          piece,
          type: step.type === ActionType.PIECE ? 'action' : 'trigger',
        });
        const agentMetadata = await getAgentMetadata(step);
        const agentDisplayName = agentMetadata.displayName;
        const actionOrTriggerDisplayName =
          step.type === ActionType.PIECE
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
      type: type === 'action' ? ActionType.PIECE : TriggerType.PIECE,
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
  step: Action | Trigger,
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
    step.type === ActionType.PIECE
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
