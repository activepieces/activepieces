import {createPiece} from '../../framework/piece';
import {addMemberToList} from './actions/add-member-to-list.action/add-member-to-list.action'

export const mailchimp = createPiece({
	name: 'mailchimp',
	displayName: "MailChimp",
	logoUrl: 'https://cdn.activepieces.com/pieces/mailchimp.png',
	actions: [addMemberToList],
	triggers: [],
});
