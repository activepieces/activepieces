import { api } from '@/lib/api';
import {
  DropdownState,
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PiecePropertyMap,
} from '@activepieces/pieces-framework';
import {
  Action,
  ActionType,
  AddPieceRequestBody,
  GetPieceRequestParams,
  GetPieceRequestQuery,
  ListPiecesRequestQuery,
  PackageType,
  PieceOptionRequest,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import { PieceStepMetadata, StepMetadata } from './pieces-hook';
export const PRIMITIVE_STEP_METADATA = {
  [ActionType.CODE]: {
    displayName: 'Code',
    logoUrl: 'https://cdn.activepieces.com/pieces/code.svg',
    description: 'Powerful Node.js & TypeScript code with npm',
    type: ActionType.CODE,
  },
  [ActionType.LOOP_ON_ITEMS]: {
    displayName: 'Loop on Items',
    logoUrl: 'https://cdn.activepieces.com/pieces/loop.svg',
    description: 'Iterate over a list of items',
    type: ActionType.LOOP_ON_ITEMS,
  },
  [ActionType.BRANCH]: {
    displayName: 'Branch',
    logoUrl: 'https://cdn.activepieces.com/pieces/branch.svg',
    description: 'Branch',
    type: ActionType.BRANCH,
  },
  [TriggerType.EMPTY]: {
    displayName: 'Empty Trigger',
    logoUrl: 'https://cdn.activepieces.com/pieces/empty-trigger.svg',
    description: 'Empty Trigger',
    type: TriggerType.EMPTY,
  },
};

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
  options<T extends DropdownState<unknown> | PiecePropertyMap>(
    request: PieceOptionRequest,
  ): Promise<T> {
    return api.post<T>(`/v1/pieces/options`, request);
  },
  mapToMetadata(
    type: 'action' | 'trigger',
    piece: PieceMetadataModelSummary | PieceMetadataModel,
  ): PieceStepMetadata {
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
    };
  },
  async getMetadata(step: Action | Trigger): Promise<StepMetadata> {
    switch (step.type) {
      case ActionType.BRANCH:
      case ActionType.LOOP_ON_ITEMS:
      case ActionType.CODE:
      case TriggerType.EMPTY:
        return PRIMITIVE_STEP_METADATA[step.type];
      case ActionType.PIECE:
      case TriggerType.PIECE: {
        const { pieceName, pieceVersion } = step.settings;
        const piece = await piecesApi.get({
          name: pieceName,
          version: pieceVersion,
        });
        return piecesApi.mapToMetadata(
          step.type === ActionType.PIECE ? 'action' : 'trigger',
          piece,
        );
      }
    }
  },
  syncFromCloud() {
    return api.post<void>(`/v1/pieces/sync`, {});
  },
  async install(params: AddPieceRequestBody) {
    const formData = new FormData();
    formData.set('packageType', params.packageType);
    formData.set('pieceName', params.pieceName);
    formData.set('pieceVersion', params.pieceVersion);
    formData.set('scope', params.scope);
    if (params.packageType === PackageType.ARCHIVE) {
      const buffer = await (params.pieceArchive as File).arrayBuffer();
      formData.append('pieceArchive', new Blob([buffer]));
    }

    return api.post<PieceMetadataModel>('/v1/pieces', formData, undefined, {
      'Content-Type': 'multipart/form-data',
    });
  },
  delete(id: string) {
    return api.delete(`/v1/pieces/${id}`);
  },
};
