import {createPiece} from '../../framework/piece';
import { insertRowAction } from './actions/insert-row.action';

export const googleSheets = createPiece({
	name: 'Google Sheets',
	logoUrl: 'https://cdn.activepieces.com/components/googlesheets/logo.png',
	actions: [insertRowAction],
    displayName:"Google Sheets",
	triggers: [],
});