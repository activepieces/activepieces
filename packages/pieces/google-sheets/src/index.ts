import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { insertRowAction } from './lib/actions/insert-row.action';
import { newRowAdded } from './lib/triggers/new-row-added';
import { deleteRowAction } from './lib/actions/delete-row.action';
import { updateRowAction } from './lib/actions/update-row';

export const googleSheets = createPiece({
	name: 'google-sheets',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
	authors: ['abuaboud', 'AbdulTheActivepiecer', 'Shay Punter'],
	actions: [insertRowAction, deleteRowAction, updateRowAction],
	displayName: "Google Sheets",
	triggers: [newRowAdded],
	version: packageJson.version,
});
