import { api } from '@/lib/api';
import {
  File,
  GetSampleDataRequest,
  SaveSampleDataRequest,
} from '@activepieces/shared';

export const sampleDataApi = {
  save(request: SaveSampleDataRequest) {
    return api.post<File>(`/v1/sample-data`, request);
  },
  get(request: GetSampleDataRequest) {
    return api.get<unknown>(`/v1/sample-data`, request);
  },
};
