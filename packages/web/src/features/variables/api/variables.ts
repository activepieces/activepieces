import {
  AppConnectionOwners,
  ListVariablesRequestQuery,
  RevealVariableResponse,
  SeekPage,
  UpdateVariableRequestBody,
  UpsertVariableRequestBody,
  VariableWithoutSensitiveData,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const variablesApi = {
  list(
    request: ListVariablesRequestQuery,
  ): Promise<SeekPage<VariableWithoutSensitiveData>> {
    return api.get<SeekPage<VariableWithoutSensitiveData>>(
      '/v1/variables',
      request,
    );
  },
  create(
    request: UpsertVariableRequestBody,
  ): Promise<VariableWithoutSensitiveData> {
    return api.post<VariableWithoutSensitiveData>('/v1/variables', request);
  },
  update(
    id: string,
    request: UpdateVariableRequestBody,
  ): Promise<VariableWithoutSensitiveData> {
    return api.post<VariableWithoutSensitiveData>(
      `/v1/variables/${id}`,
      request,
    );
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/variables/${id}`);
  },
  reveal(id: string): Promise<RevealVariableResponse> {
    return api.post<RevealVariableResponse>(`/v1/variables/${id}/reveal`, {});
  },
  getOwners(request: {
    projectId: string;
  }): Promise<SeekPage<AppConnectionOwners>> {
    return api.get<SeekPage<AppConnectionOwners>>(
      '/v1/variables/owners',
      request,
    );
  },
};
