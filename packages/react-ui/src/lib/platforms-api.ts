import {
  PlatformWithoutSensitiveData,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';

import { api } from './api';
import { authenticationSession } from './authentication-session';

export const platformApi = {
  deleteAccount() {
    return api.delete<void>(
      `/v1/platforms/${authenticationSession.getPlatformId()}`,
    );
  },
  getCurrentPlatform() {
    const platformId = authenticationSession.getPlatformId();
    if (!platformId) {
      throw Error('No platform id found');
    }
    return api.get<PlatformWithoutSensitiveData>(`/v1/platforms/${platformId}`);
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
  updateWithFormData(formdata: FormData, platformId: string) {
    return api.post<PlatformWithoutSensitiveData>(
      `/v1/platforms/${platformId}`,
      formdata,
      {},
      {
        'Content-Type': 'multipart/form-data',
      },
    );
  },
};
