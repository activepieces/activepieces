import {createPiece} from '../../framework/piece';
import { newRecord } from './trigger/new-record';
import { updatedRecord } from './trigger/updated-record';


export const salesforce = createPiece({
	name: 'salesforce',
	displayName: "Salesforce",
	logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
	actions: [],
	triggers: [newRecord, updatedRecord],
});