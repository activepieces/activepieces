import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PiecePackageInformation,
  PropertyType,
  ExecutePropsResult,
} from '@activepieces/pieces-framework';
import {
  AddPieceRequestBody,
  ApEdition,
  GetPieceRequestParams,
  GetPieceRequestQuery,
  ListPiecesRequestQuery,
  PackageType,
  PieceOptionRequest,
} from '@activepieces/shared';
import { t } from 'i18next';

import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';

export const piecesApi = {
  list(request: ListPiecesRequestQuery): Promise<PieceMetadataModelSummary[]> {
    return api.get<PieceMetadataModelSummary[]>('/v1/pieces', request);
  },
  get(
    request: GetPieceRequestParams & GetPieceRequestQuery,
  ): Promise<PieceMetadataModel> {
    return api.get<PieceMetadataModel>(`/v1/pieces/${request.name}`, {
      version: request.version ?? undefined,
      locale: request.locale ?? undefined,
      projectId: request.projectId ?? undefined,
      audience: request.audience ?? undefined,
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
      .then((response) => {
        if (
          propertyType === PropertyType.DYNAMIC &&
          !hasPropertyMapOptions(response)
        ) {
          throw new Error('Dynamic properties did not resolve to a schema');
        }
        return response;
      })
      .catch((error) => {
        if (propertyType === PropertyType.DYNAMIC) {
          throw error;
        }
        console.error(error);
        internalErrorToast();
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
        return defaultStateForDropdownProperty as ExecutePropsResult<T>;
      });
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
  registry(
    release: string,
    edition: ApEdition,
  ): Promise<PiecePackageInformation[]> {
    return api.get<PiecePackageInformation[]>('/v1/pieces/registry', {
      release,
      edition,
    });
  },
  delete(id: string) {
    return api.delete(`/v1/pieces/${id}`);
  },
};

function hasPropertyMapOptions(response: unknown): boolean {
  if (!isObject(response) || !('options' in response)) {
    return false;
  }
  const { options } = response;
  return (
    isObject(options) &&
    Object.values(options).every(
      (property) =>
        isObject(property) &&
        'type' in property &&
        typeof property.type === 'string',
    )
  );
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
