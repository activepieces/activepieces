import { createPiece } from '@activepieces/framework';
import { airtableNewRecord } from './trigger/new-record.trigger';

export const airtable = createPiece({
	name: 'airtable',
	displayName: 'Airtable',
	logoUrl: 'https://cdn.activepieces.com/pieces/airtable.png',
  version: '0.0.0',
	authors: ['AbdulTheActivePiecer'],
	actions: [],
	triggers: [airtableNewRecord],
});
