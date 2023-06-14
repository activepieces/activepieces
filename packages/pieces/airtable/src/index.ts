import { createPiece } from '@activepieces/pieces-framework';
import { airtableNewRecord } from './lib/trigger/new-record.trigger';
import { airtableAuthProp } from './lib/common';

export const airtable = createPiece({
	displayName: 'Airtable',
	logoUrl: 'https://cdn.activepieces.com/pieces/airtable.png',
	authors: ['AbdulTheActivePiecer', 'kanarelo'],
	actions: [],
	triggers: [airtableNewRecord],
    auth: airtableAuthProp
});
