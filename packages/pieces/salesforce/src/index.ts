
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { newRecord } from './lib/trigger/new-record';
import { newOrUpdatedRecord } from './lib/trigger/new-updated-record';
import { upsertByExternalId } from './lib/action/upsert-by-external-id';
import { runQuery } from './lib/action/run-sf-query';
import { createNewObject } from './lib/action/create-new-object';
import { UpdateObjectById } from './lib/action/update-object-by-id';

export const salesforce = createPiece({
  name: 'salesforce',
  displayName: 'Salesforce',
  logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
  version: packageJson.version,
  authors: [
    "abuaboud",
    "HKudria"
  ],
  actions: [
    runQuery,
    createNewObject,
    UpdateObjectById,
    upsertByExternalId
  ],
  triggers: [newRecord, newOrUpdatedRecord],
});
