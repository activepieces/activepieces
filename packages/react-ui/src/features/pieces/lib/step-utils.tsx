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
} from '@activepieces/shared';

import { piecesApi } from './pieces-api';
import { CORE_STEP_METADATA } from './steps-hooks';
import {
  PieceStepMetadata,
  StepMetadata,
  StepMetadataWithStepName,
} from './types';

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
    const agentId = getAgentId(step);
    return [pieceName, pieceVersion, customLogoUrl, agentId, locale];
  },
  async getMetadata(
    step: Action | Trigger,
    locale: LocalesEnum,
  ): Promise<StepMetadataWithStepName> {
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
          stepDisplayName: step.displayName,
        };
      case ActionType.PIECE:
      case TriggerType.PIECE: {
        const piece = await piecesApi.get({
          name: step.settings.pieceName,
          version: step.settings.pieceVersion,
          locale: locale,
        });
        const metadata = stepUtils.mapPieceToMetadata(
          piece,
          step.type === ActionType.PIECE ? 'action' : 'trigger',
        );
        const dataToOverride = await getDataToOverride(step);
        return {
          ...metadata,
          stepDisplayName: step.displayName,
          ...spreadIfDefined('logoUrl', customLogoUrl),
          ...spreadIfDefined('description', piece.description),
          errorHandlingOptions: mapErrorHandlingOptions(piece, step),
          ...dataToOverride,
        };
      }
    }
  },
  mapPieceToMetadata(
    piece: PieceMetadataModelSummary | PieceMetadataModel,
    type: 'action' | 'trigger',
  ): Omit<PieceStepMetadata, 'stepDisplayName'> {
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
  isAgentPiece(action: Step) {
    return (
      action.type === ActionType.PIECE &&
      action.settings.pieceName === '@activepieces/piece-agent'
    );
  },
};

async function getDataToOverride(
  step: Action | Trigger,
): Promise<
  Partial<Pick<StepMetadata, 'displayName' | 'logoUrl' | 'description'>>
> {
  if (stepUtils.isAgentPiece(step)) {
    const agentId = getAgentId(step);
    if (!agentId) {
      return {};
    }
    const agent = await agentsApi.get(agentId);
    if (!agent) {
      return {};
    }
    return {
      logoUrl: agent.profilePictureUrl,
      description: agent.description,
    };
  }
  return {};
}

function getAgentId(action: Step) {
  if (!stepUtils.isAgentPiece(action)) {
    return undefined;
  }
  return 'input' in action.settings && 'agentId' in action.settings.input
    ? (action.settings.input.agentId as string)
    : undefined;
}

function mapErrorHandlingOptions(
  piece: PieceMetadataModel,
  step: Step,
): ErrorHandlingOptionsParam {
  if (flowStructureUtil.isTrigger(step.type)) {
    return {
      continueOnFailure: {
        hide: false,
      },
      retryOnFailure: {
        hide: false,
      },
    };
  }
  const selectedAction =
    step.type === ActionType.PIECE
      ? piece?.actions[step.settings.actionName!]
      : null;
  return {
    continueOnFailure: {
      hide:
        selectedAction?.errorHandlingOptions?.continueOnFailure?.hide ?? false,
      defaultValue:
        selectedAction?.errorHandlingOptions?.continueOnFailure?.defaultValue ??
        false,
    },
    retryOnFailure: {
      hide: selectedAction?.errorHandlingOptions?.retryOnFailure?.hide ?? false,
      defaultValue:
        selectedAction?.errorHandlingOptions?.retryOnFailure?.defaultValue ??
        false,
    },
  };
}
