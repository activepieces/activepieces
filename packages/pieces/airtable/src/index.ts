import { createPiece } from '@activepieces/pieces-framework';
import { airtableNewRecord } from './lib/trigger/new-record.trigger';
import { airtableCreateRecord } from './lib/actions/create-record';

export const airtable = createPiece({
	displayName: 'Airtable',
	logoUrl: 'https://cdn.activepieces.com/pieces/airtable.png',
	authors: ['AbdulTheActivePiecer', 'kanarelo'],
	actions: [airtableCreateRecord],
	triggers: [airtableNewRecord],
});
