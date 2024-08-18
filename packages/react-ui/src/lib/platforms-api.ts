import { Platform, UpdatePlatformRequestBody } from '@activepieces/shared';

import { api } from './api';
import { authenticationSession } from './authentication-session';

export const platformApi = {
  getCurrentPlatform() {
    const platformId = authenticationSession.getPlatformId();
    if (!platformId) {
      throw Error('No platform id found');
    }
    return api.get<Platform>(`/v1/platforms/${platformId}`);
  },

  update(req: UpdatePlatformRequestBody, platformId: string) {
    return api.post<void>(`/v1/platforms/${platformId}`, req);
  },
};
