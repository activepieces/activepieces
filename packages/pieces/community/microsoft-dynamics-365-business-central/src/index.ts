import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRecordAction } from './lib/actions/create-record.action';
import { deleteRecordAction } from './lib/actions/delete-record.action';
import { getRecordAction } from './lib/actions/get-record.action';
import { searchRecordsAction } from './lib/actions/search-records.action';
import { updateRecordAction } from './lib/actions/update-record.action';
import { businessCentralAuth } from './lib/auth';
import { newOrUpdatedRecordTrigger } from './lib/triggers/new-or-updated-record.trigger';

export const microsoftDynamics365BusinessCentral = createPiece({
  displayName: 'Microsoft Dynamics 365 Business Central',
  auth: businessCentralAuth,
  description: 'All-in-one business management solution by Microsoft.',
  categories: [PieceCategory.SALES_AND_CRM],
  minimumSupportedRelease: '0.27.1',
  logoUrl:
    'https://cdn.activepieces.com/pieces/microsoft-dynamics-365-business-central.png',
  authors: ['kishanprmr'],
  actions: [
    createRecordAction,
    deleteRecordAction,
    getRecordAction,
    updateRecordAction,
    searchRecordsAction,
    createCustomApiCallAction({
      auth: businessCentralAuth,
      baseUrl: (auth) => {
        return `https://api.businesscentral.dynamics.com/v2.0/${
          (auth as OAuth2PropertyValue).props?.['environment']
        }/api/v2.0`;
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer  ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newOrUpdatedRecordTrigger],
});
