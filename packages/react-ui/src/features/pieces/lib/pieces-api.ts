import { t } from 'i18next';

import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PropertyType,
  ExecutePropsResult,
  InputPropertyMap,
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
  spreadIfDefined,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import { PieceStepMetadata, StepMetadata } from './types';

export const CORE_STEP_METADATA: Record<
  Exclude<ActionType, ActionType.PIECE> | TriggerType.EMPTY,
  StepMetadata
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
    displayName: 'Router',
    logoUrl: 'https://cdn.activepieces.com/pieces/branch.svg',
    description: t('Split your flow into branches depending on condition(s)'),
    type: ActionType.ROUTER,
  },
  [TriggerType.EMPTY]: {
    displayName: t('Empty Trigger'),
    logoUrl: 'https://cdn.activepieces.com/pieces/empty-trigger.svg',
    description: t('Empty Trigger'),
    type: TriggerType.EMPTY as const,
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
  options<
    T extends
      | PropertyType.DROPDOWN
      | PropertyType.MULTI_SELECT_DROPDOWN
      | PropertyType.DYNAMIC,
  >(
    request: PieceOptionRequest,
    propertyType: T,
  ): Promise<ExecutePropsResult<T>> {
    return api
      .post<ExecutePropsResult<T>>(`/v1/pieces/options`, request)
      .catch((error) => {
        console.error(error);
        toast({
          title: t('Error'),
          description: t(
            'An internal error occurred while fetching data, please contact support',
          ),
          variant: 'destructive',
        });
        const defaultStateForDynamicProperty: ExecutePropsResult<PropertyType.DYNAMIC> =
          {
            options: {} as InputPropertyMap,
            type: PropertyType.DYNAMIC,
          };
        const defaultStateForDropdownProperty: ExecutePropsResult<PropertyType.DROPDOWN> =
          {
            options: {
              options: [],
              disabled: true,
              placeholder: t(
                'An internal error occurred, please contact support',
              ),
            },
            type: PropertyType.DROPDOWN,
          };
        return (
          propertyType === PropertyType.DYNAMIC
            ? defaultStateForDynamicProperty
            : defaultStateForDropdownProperty
        ) as ExecutePropsResult<T>;
      });
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
      auth: piece.auth,
    };
  },
  mapToSuggestions(
    piece: PieceMetadataModelSummary,
  ): Pick<PieceMetadataModelSummary, 'suggestedActions' | 'suggestedTriggers'> {
    return {
      suggestedActions: piece.suggestedActions,
      suggestedTriggers: piece.suggestedTriggers,
    };
  },
  async getMetadata(step: Action | Trigger): Promise<StepMetadata> {
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
        };
      case ActionType.PIECE:
      case TriggerType.PIECE: {
        const { pieceName, pieceVersion } = step.settings;
        const piece = await piecesApi.get({
          name: pieceName,
          version: pieceVersion,
        });
        const metadata = await piecesApi.mapToMetadata(
          step.type === ActionType.PIECE ? 'action' : 'trigger',
          piece,
        );
        const selectedAction =
          step.type === ActionType.PIECE
            ? piece.actions[step.settings.actionName ?? '']
            : null;

        return {
          ...metadata,
          ...spreadIfDefined('logoUrl', customLogoUrl),
          errorHandlingOptions: {
            continueOnFailure: {
              hide:
                selectedAction?.errorHandlingOptions?.continueOnFailure?.hide ??
                false,
            },
            retryOnFailure: {
              hide:
                selectedAction?.errorHandlingOptions?.retryOnFailure?.hide ??
                false,
            },
          },
        };
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
      const buffer = await (
        params.pieceArchive as unknown as File
      ).arrayBuffer();
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
