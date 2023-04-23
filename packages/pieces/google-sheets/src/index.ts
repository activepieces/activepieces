import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { insertRowAction } from './lib/actions/insert-row.action';
import { newRowAdded } from './lib/triggers/new-row-added';
import { deleteRowAction } from './lib/actions/delete-row.action';

export const googleSheets = createPiece({
	name: 'google-sheets',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
	authors: ['abuaboud', 'AbdulTheActivepiecer', 'Shay Punter'],
	actions: [insertRowAction, deleteRowAction],
	displayName: "Google Sheets",
	triggers: [newRowAdded],
	version: packageJson.version,
});
