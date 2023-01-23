import {createPiece} from '../../framework/piece';
import { insertRowAction } from './actions/insert-row.action';
import { newRowAdded } from './triggers/new-row-added';

export const googleSheets = createPiece({
	name: 'google_sheets',
	logoUrl: 'https://cdn.activepieces.com/pieces/googleSheets.png',
	actions: [],
    displayName:"Google Sheets",
	triggers: [newRowAdded],
});