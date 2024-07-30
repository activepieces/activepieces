import { api } from '@/lib/api';
import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  Action,
  ActionType,
  GetPieceRequestParams,
  GetPieceRequestQuery,
  ListPiecesRequestQuery,
  Trigger,
  TriggerType,
} from '@activepieces/shared';
import { StepMetadata } from './pieces-hook';

export const piecesApi = {
  list(request: ListPiecesRequestQuery): Promise<PieceMetadataModelSummary[]> {
    return api.get<PieceMetadataModelSummary[]>('/v1/pieces', request);
  },
  get(
    request: GetPieceRequestParams & GetPieceRequestQuery,
  ): Promise<PieceMetadataModel> {
    return api.get<PieceMetadataModel>(`/v1/pieces/${request.name}`, {
      version: request.version ?? undefined,
    });
  },
  async getMetadata(step: Action | Trigger): Promise<StepMetadata> {
      switch (step.type) {
        case ActionType.BRANCH:
          return {
            displayName: 'Branch',
            logoUrl: 'https://cdn.activepieces.com/pieces/branch.svg',
            description: 'Branch',
          };
        case ActionType.CODE:
          return {
            displayName: 'Code',
            logoUrl: 'https://cdn.activepieces.com/pieces/code.svg',
            description: 'Powerful nodejs & typescript code with npm',
          };
        case ActionType.LOOP_ON_ITEMS:
          return {
            displayName: 'Loop on Items',
            logoUrl: 'https://cdn.activepieces.com/pieces/loop.svg',
            description: 'Iterate over a list of items',
          };
        case TriggerType.EMPTY:
          return {
            displayName: 'Empty Trigger',
            logoUrl: 'https://cdn.activepieces.com/pieces/empty-trigger.svg',
            description: 'Empty Trigger',
          };
        case ActionType.PIECE:
        case TriggerType.PIECE: {
          const { pieceName, pieceVersion } = step.settings;
          const piece = await piecesApi.get({
            name: pieceName,
            version: pieceVersion,
          });
          return {
            displayName: piece.displayName,
            logoUrl: piece.logoUrl,
            description: piece.description,
          };
        }
      }
  }
};
