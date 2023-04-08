
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { newRecord } from './lib/trigger/new-record';
import { newOrUpdatedRecord } from './lib/trigger/new-updated-record';

export const salesforce = createPiece({
  name: 'salesforce',
  displayName: 'Salesforce',
  logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
  version: packageJson.version,
  authors: [
    "abuaboud"
  ],
  actions: [
  ],
  triggers: [newRecord, newOrUpdatedRecord],
});
