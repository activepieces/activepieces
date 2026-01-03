import { api } from '@/lib/api';
import {
  CreatePlatformProjectRequest,
  ListProjectRequestForPlatformQueryParams,
} from '@activepieces/ee-shared';
import { ProjectWithLimits, SeekPage } from '@activepieces/shared';

export const projectApi = {
  list(request: ListProjectRequestForPlatformQueryParams) {
    return api.get<SeekPage<ProjectWithLimits>>('/v1/projects', request);
  },
};
