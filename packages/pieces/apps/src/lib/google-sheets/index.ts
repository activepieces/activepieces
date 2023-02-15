import { createPiece } from '@activepieces/framework';
import { insertRowAction } from './actions/insert-row.action';
import { newRowAdded } from './triggers/new-row-added';

export const googleSheets = createPiece({
	name: 'google_sheets',
	logoUrl: 'https://cdn.activepieces.com/pieces/google_sheets.png',
	actions: [insertRowAction],
	displayName: "Google Sheets",
	triggers: [newRowAdded],
});
