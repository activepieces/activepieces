
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { newRecord } from './lib/trigger/new-record';
import { newOrUpdatedRecord } from './lib/trigger/new-updated-record';
import { upsertByExternalId } from './lib/action/upsert-by-external-id';

export const salesforce = createPiece({
  name: 'salesforce',
  displayName: 'Salesforce',
  logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
  version: packageJson.version,
  type: PieceType.PUBLIC,
  authors: [
    "abuaboud"
  ],
  actions: [
    upsertByExternalId
  ],
  triggers: [newRecord, newOrUpdatedRecord],
});
