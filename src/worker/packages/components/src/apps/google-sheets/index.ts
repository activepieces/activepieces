import {createComponent} from '../../framework/component';
import { insertRowAction } from './actions/insert-row.action';

export const googleSheets = createComponent({
	name: 'Google Sheets',
	logoUrl: 'https://cdn.activepieces.com/components/googlesheets/logo.png',
	actions: [insertRowAction],
    displayName:"Google Sheets",
	triggers: [],
});