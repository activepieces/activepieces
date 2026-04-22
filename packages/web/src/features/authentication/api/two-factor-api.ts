import { AuthenticationResponse } from '@activepieces/shared';

import { api } from '@/lib/api';

export const twoFactorApi = {
  status() {
    return api.get<{
      enabled: boolean;
      backupCodesRemaining: number;
      hasPassword: boolean;
    }>('/v1/authn/2fa/status');
  },
  enable(req: { password?: string }) {
    return api.post<{ totpURI: string; backupCodes: string[] }>(
      '/v1/authn/2fa/enable',
      req,
    );
  },
  verifyTotp(req: { code: string }) {
    return api.post<AuthenticationResponse>('/v1/authn/2fa/verify-totp', req);
  },
  verifyBackupCode(req: { code: string }) {
    return api.post<AuthenticationResponse>(
      '/v1/authn/2fa/verify-backup-code',
      req,
    );
  },
  disable(req: { password?: string }) {
    return api.post<{ status: boolean }>('/v1/authn/2fa/disable', req);
  },
  generateBackupCodes(req: { password?: string }) {
    return api.post<{ backupCodes: string[] }>(
      '/v1/authn/2fa/generate-backup-codes',
      req,
    );
  },
};
