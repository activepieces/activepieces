import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { insertRowAction } from './lib/actions/insert-row.action';
import { newRowAdded } from './lib/triggers/new-row-added';

export const googleSheets = createPiece({
	name: 'google_sheets',
	logoUrl: 'https://cdn.activepieces.com/pieces/google_sheets.png',
	authors: ['abuaboud', 'AbdulTheActivepiecer'],
	actions: [insertRowAction],
	displayName: "Google Sheets",
	triggers: [newRowAdded],
  version: packageJson.version,
});
