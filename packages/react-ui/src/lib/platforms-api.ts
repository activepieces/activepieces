import {
  LicenseKeyEntity,
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

  listPlatforms() {
    return api.get<PlatformWithoutSensitiveData[]>(`/v1/platforms`);
  },

  getLicenseKey(licenseKey: string) {
    return api.get<LicenseKeyEntity>(`/v1/license-keys/${licenseKey}`);
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
