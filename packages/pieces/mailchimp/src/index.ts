import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { addMemberToList } from './lib/actions/add-member-to-list.action/add-member-to-list.action'
import { mailChimpSubscribeTrigger } from './lib/triggers/subscribe-trigger';

export const mailchimpAuth = PieceAuth.OAuth2({
    description: "",
    
    authUrl: "https://login.mailchimp.com/oauth2/authorize",
    tokenUrl: "https://login.mailchimp.com/oauth2/token",
    required: true,
    scope: []
});

export const mailchimp = createPiece({
	displayName: "Mailchimp",
	minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/mailchimp.png',
	authors: ['AbdulTheActivePiecer'],
    auth: mailchimpAuth,
	actions: [addMemberToList],
	triggers: [mailChimpSubscribeTrigger],
});
