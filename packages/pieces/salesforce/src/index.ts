
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { newRecord } from './lib/trigger/new-record';
import { newOrUpdatedRecord } from './lib/trigger/new-updated-record';
import { upsertByExternalId } from './lib/action/upsert-by-external-id';
import { runQuery } from './lib/action/run-sf-query';

export const salesforce = createPiece({
  name: 'salesforce',
  displayName: 'Salesforce',
  logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
  version: packageJson.version,
  authors: [
    "abuaboud"
  ],
  actions: [
    runQuery,
    upsertByExternalId
  ],
  triggers: [newRecord, newOrUpdatedRecord],
});
