import { createPiece } from '@activepieces/pieces-framework';
import { addMemberToList } from './lib/actions/add-member-to-list.action/add-member-to-list.action'
import { mailChimpSubscribeTrigger } from './lib/triggers/subscribe-trigger';

export const mailchimp = createPiece({
	displayName: "Mailchimp",
	logoUrl: 'https://cdn.activepieces.com/pieces/mailchimp.png',
	authors: ['AbdulTheActivePiecer'],
	actions: [addMemberToList],
	triggers: [mailChimpSubscribeTrigger],
});
