import { createPiece } from '@activepieces/framework';
import { airtableNewRecord } from './trigger/new-record.trigger';

export const airtable = createPiece({
	name: 'airtable',
	displayName: 'Airtable',
	logoUrl: 'https://cdn.activepieces.com/pieces/airtable.png',
	actions: [],
	triggers: [airtableNewRecord],
});
