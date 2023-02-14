import {createPiece} from '../../framework/piece';
import {addMemberToList} from './actions/add-member-to-list.action/add-member-to-list.action'
import {mailChimpSubscribeTrigger} from './triggers/subscribe-trigger';

export const mailchimp = createPiece({
	name: 'mailchimp',
	displayName: "Mailchimp",
	logoUrl: 'https://cdn.activepieces.com/pieces/mailchimp.png',
	actions: [addMemberToList],
	triggers: [mailChimpSubscribeTrigger],
});
