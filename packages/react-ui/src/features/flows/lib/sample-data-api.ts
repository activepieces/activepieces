import { api } from '@/lib/api';
import { GetSampleDataRequest } from '@activepieces/shared';

export const sampleDataApi = {
  get(request: GetSampleDataRequest) {
    return api.get<unknown>(`/v1/sample-data`, request);
  },
};
