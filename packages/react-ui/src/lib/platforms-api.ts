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

  saveLicenseKey(licenseKey: string) {
    return api.post<void>(`/v1/flags/saveLicenseKey`, {
      licenseKey,
    });
  },

  getLicenseKey() {
    return api.get<Record<string, unknown>>(`/v1/flags`);
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
    return api.post<void>(`/v1/platforms/${platformId}`, req);
  },
};
