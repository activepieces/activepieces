import { api } from '@/lib/api';
import {
  ImportSolutionRequestBody,
  ExportSolutionRequestBody,
  ImportSolutionResponse,
} from '@activepieces/shared';

export const solutionsApi = {
  import: async (request: ImportSolutionRequestBody) => {
    return api.post<ImportSolutionResponse>(`/v1/solutions/import`, request);
  },
  export: async (request: ExportSolutionRequestBody) => {
    return api.post<void>(`/v1/solutions/export`, request);
  },
};
