import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createNewObject } from './lib/action/create-new-object';
import { runQuery } from './lib/action/run-sf-query';
import { UpdateObjectById } from './lib/action/update-object-by-id';
import { upsertByExternalId } from './lib/action/upsert-by-external-id';
import { upsertByExternalIdBulk } from './lib/action/upsert-by-external-id-bulk';
import { newRecord } from './lib/trigger/new-record';
import { newOrUpdatedRecord } from './lib/trigger/new-updated-record';

export const salesforceAuth = PieceAuth.OAuth2({
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Choose environment',
      required: true,
      options: {
        options: [
          {
            label: 'Production',
            value: 'login',
          },
          {
            label: 'Development',
            value: 'test',
          },
        ],
      },
      defaultValue: 'login',
    }),
  },

  required: true,
  description: 'Authenticate with Salesforce Production',
  authUrl: 'https://{environment}.salesforce.com/services/oauth2/authorize',
  tokenUrl: 'https://{environment}.salesforce.com/services/oauth2/token',
  scope: ['refresh_token', 'full'],
});

export const salesforce = createPiece({
  displayName: 'Salesforce',
  description: 'CRM software solutions and enterprise cloud computing',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
  authors: ["HKudria","tanoggy","landonmoir","kishanprmr","khaledmashaly","abuaboud"],
  categories: [PieceCategory.SALES_AND_CRM],
  auth: salesforceAuth,
  actions: [
    runQuery,
    createNewObject,
    UpdateObjectById,
    upsertByExternalId,
    upsertByExternalIdBulk,
  ],
  triggers: [newRecord, newOrUpdatedRecord],
});
