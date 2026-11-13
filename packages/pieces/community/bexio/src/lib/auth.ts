import { PieceAuth } from '@activepieces/pieces-framework';
import { BexioClient } from './common/client';

export const bexioAuth = PieceAuth.OAuth2({
  authUrl: 'https://auth.bexio.com/realms/bexio/protocol/openid-connect/auth',
  tokenUrl: 'https://auth.bexio.com/realms/bexio/protocol/openid-connect/token',
  required: true,
  scope: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'contact_show',
    'contact_edit',
    'article_show',
    'article_edit',
    'kb_invoice_show',
    'kb_invoice_edit',
    'kb_offer_show',
    'kb_offer_edit',
    'kb_order_show',
    'kb_order_edit',
    'project_show',
    'project_edit',
    'task_show',
    'monitoring_edit',
    'accounting',
    'file',
  ],
  validate: async ({ auth }) => {
    try {
      const client = new BexioClient(auth);
      await client.get('/3.0/users/me');
      return {
        valid: true,
      };
    } catch (error) {
      const status = readStatus(error);
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: `Bexio rejected the connection (HTTP ${status}). Reconnect the account and make sure the Bexio app grants the requested scopes.`,
        };
      }
      return {
        valid: false,
        error: status
          ? `Bexio could not validate the connection (HTTP ${status}). Try again later.`
          : 'Bexio could not be reached to validate the connection. Try again later.',
      };
    }
  },
});

function readStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('status' in response)) {
    return undefined;
  }
  return typeof response.status === 'number' ? response.status : undefined;
}
