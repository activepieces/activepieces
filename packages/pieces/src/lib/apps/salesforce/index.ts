import {createPiece} from '../../framework/piece';
import { updatedFieldOnRecord } from './trigger/updated-field-on-record';


export const salesforce = createPiece({
	name: 'salesforce',
	displayName: "Salesforce",
	logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
	actions: [],
	triggers: [updatedFieldOnRecord],
});