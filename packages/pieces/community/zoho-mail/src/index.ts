import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
	createPiece,
	OAuth2PropertyValue,
	PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getEmailDetailsAction } from './lib/actions/get-email-details';
import { markEmailAsReadAction } from './lib/actions/mark-email-as-read';
import { markEmailAsUnreadAction } from './lib/actions/mark-email-as-unread';
import { moveEmailAction } from './lib/actions/move-email';
import { sendEmailAction } from './lib/actions/send-email';
import { zohoMailAuth } from './lib/common/auth';
import { newEmailReceivedTrigger } from './lib/triggers/new-email-received-trigger';

export const zohoMail = createPiece({
	displayName: 'Zoho Mail',
	logoUrl: 'https://cdn.activepieces.com/pieces/zoho-mail.png',
	auth: zohoMailAuth,
	authors: ['onyedikachi-david', 'kishanprmr'],
	description:
		'Zoho Mail is a powerful email service that allows you to manage your email, contacts, and calendars efficiently.',
	minimumSupportedRelease: '0.36.1',
	categories: [PieceCategory.COMMUNICATION],
	actions: [
		getEmailDetailsAction,
		markEmailAsReadAction,
		markEmailAsUnreadAction,
		moveEmailAction,
		sendEmailAction,
		createCustomApiCallAction({
			auth: zohoMailAuth,
			baseUrl: (auth) => {
				const authValue = auth as PiecePropValueSchema<typeof zohoMailAuth>;
				const location = authValue.props?.['location'] ?? 'zoho.com';
				return `https://mail.${location}/api`;
			},
			authMapping: async (auth) => {
				return {
					Authorization: `Zoho-oauthtoken ${(auth as OAuth2PropertyValue).access_token}`,
				};
			},
		}),
	],
	triggers: [newEmailReceivedTrigger],
});
