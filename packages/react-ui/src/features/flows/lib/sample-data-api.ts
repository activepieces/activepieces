import { api } from '@/lib/api';
import {
  GetSampleDataRequest,
  SaveSampleDataRequest,
  SaveSampleDataResponse,
} from '@activepieces/shared';

export const sampleDataApi = {
  save(request: SaveSampleDataRequest) {
    return api.post<SaveSampleDataResponse>(`/v1/sample-data`, request);
  },
  get(request: GetSampleDataRequest) {
    return api.get<unknown>(`/v1/sample-data`, request);
  },
};
