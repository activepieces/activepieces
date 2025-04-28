import {
  PlatformWithoutSensitiveData,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';

import { api } from './api';
import { authenticationSession } from './authentication-session';

export const platformApi = {
  getCurrentPlatform() {
    const platformId = authenticationSession.getPlatformId();
    if (!platformId) {
      throw Error('No platform id found');
    }
    return api.get<PlatformWithoutSensitiveData>(`/v1/platforms/${platformId}`);
  },

  isCloudPlatform() {
    const platformId = authenticationSession.getPlatformId();
    if (!platformId) {
      return Promise.resolve(false);
    }
    return api.get<boolean>(`/v1/platforms/is-cloud-platform/${platformId}`);
  },

  verifyLicenseKey(licenseKey: string) {
    const platformId = authenticationSession.getPlatformId();
    if (!platformId) {
      throw Error('No platform id found');
    }
    return api.post<void>(`/v1/license-keys/verify`, {
      platformId,
      licenseKey,
    });
  },

  update(req: UpdatePlatformRequestBody, platformId: string) {
    return api.post<PlatformWithoutSensitiveData>(
      `/v1/platforms/${platformId}`,
      req,
    );
  },
};
