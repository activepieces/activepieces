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
      await client.get('/users/me');
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Authentication failed. Please check your connection and try again.',
      };
    }
  },
});
