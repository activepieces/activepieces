import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { airtableNewRecord } from './lib/trigger/new-record.trigger';
import { airtableCreateRecord } from './lib/actions/create-record';

export const airtable = createPiece({
	name: 'airtable',
	displayName: 'Airtable',
	logoUrl: 'https://cdn.activepieces.com/pieces/airtable.png',
	version: packageJson.version,
	type: PieceType.PUBLIC,
	authors: ['AbdulTheActivePiecer', 'kanarelo'],
	actions: [airtableCreateRecord],
	triggers: [airtableNewRecord],
});
