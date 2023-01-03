import {createPiece} from '../../framework/piece';
import { newLeads } from './trigger/new-leads.trigger';

export const facebook = createPiece({
	name: 'facebook',
	displayName: "Facebook",
	logoUrl: 'https://cdn.activepieces.com/pieces/facebook.png',
	actions: [],
	triggers: [newLeads],
});
