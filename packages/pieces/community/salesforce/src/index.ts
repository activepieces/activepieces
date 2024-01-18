import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { newRecord } from './lib/trigger/new-record';
import { newOrUpdatedRecord } from './lib/trigger/new-updated-record';
import { upsertByExternalId } from './lib/action/upsert-by-external-id';
import { runQuery } from './lib/action/run-sf-query';
import { createNewObject } from './lib/action/create-new-object';
import { UpdateObjectById } from './lib/action/update-object-by-id';
import { upsertByExternalIdBulk } from './lib/action/upsert-by-external-id-bulk';

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
  scope: ['refresh_token+full'],
});

export const salesforce = createPiece({
  displayName: 'Salesforce',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
  authors: ['abuaboud', 'HKudria'],
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
