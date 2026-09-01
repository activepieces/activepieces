import {
  PlatformConfiguration,
  UpdatePlatformConfigurationRequestBody,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const platformConfigurationApi = {
  get() {
    return api.get<PlatformConfiguration>('/v1/platform-configurations');
  },
  update(request: UpdatePlatformConfigurationRequestBody) {
    return api.post<PlatformConfiguration>(
      '/v1/platform-configurations',
      request,
    );
  },
};
