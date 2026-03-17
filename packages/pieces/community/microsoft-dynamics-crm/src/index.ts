import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRecordAction } from './lib/actions/create-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { getRecordAction } from './lib/actions/get-record';
import { updateRecordAction } from './lib/actions/update-record';
import { dynamicsCRMAuth } from './lib/auth';

export function getBaseUrl(host: string, proxyUrl?: string): string {
  if (proxyUrl && proxyUrl !== '') {
    return proxyUrl;
  }
  return host;
}

export const microsoftDynamicsCrm = createPiece({
  displayName: 'Microsoft Dynamics CRM',
  auth: dynamicsCRMAuth,
  description:
    'Customer relationship management software package developed by Microsoft.',
  minimumSupportedRelease: '0.27.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-dynamics-crm.png',
  authors: ['kishanprmr'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    createRecordAction,
    deleteRecordAction,
    getRecordAction,
    updateRecordAction,
    createCustomApiCallAction({
      auth: dynamicsCRMAuth,
      baseUrl: (auth) => {
        const props = auth?.props;
        if (!props) {
          return '';
        }
        return `${getBaseUrl(
          props['hostUrl'] as string,
          props['proxyUrl'] as string
        )}/api/data/v9.2`;
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer  ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [],
});
