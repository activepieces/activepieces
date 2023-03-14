import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { airtableNewRecord } from './lib/trigger/new-record.trigger';

export const airtable = createPiece({
	name: 'airtable',
	displayName: 'Airtable',
	logoUrl: 'https://cdn.activepieces.com/pieces/airtable.png',
	version: packageJson.version,
	authors: ['AbdulTheActivePiecer'],
	actions: [],
	triggers: [airtableNewRecord],
});
