import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { findUserByCustomFieldAction } from './lib/actions/find-user-by-custom-field';
import { createSubscriberAction } from './lib/actions/create-subscriber';
import { sendContentToUserAction } from './lib/actions/send-content-to-user';
import { setCustomFieldAction } from './lib/actions/set-custom-fields';
import { removeTagFromUserAction } from './lib/actions/remove-tag-from-user';
import { addTagToUserAction } from './lib/actions/add-tag-to-user';
import { findUserByNameAction } from './lib/actions/find-user-by-name';
import { PieceCategory } from '@activepieces/shared';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/props';

export const manychatAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: `You can create an API key by navigating to **Setting -> Extensions -> API**.`,
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: `${BASE_URL}/page/getInfo`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth as string,
				},
			});
			return {
				valid: true,
			};
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid API Key',
			};
		}
	},
});

export const manychat = createPiece({
	displayName: 'Manychat',
	description: 'Automations for Instagram, WhatsApp, TikTok, and Messenger marketing.',
	categories: [PieceCategory.MARKETING],
	auth: manychatAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/manychat.png',
	authors: ['neo773', 'kishanprmr'],
	actions: [
		addTagToUserAction,
		createSubscriberAction,
		findUserByCustomFieldAction,
		findUserByNameAction,
		removeTagFromUserAction,
		sendContentToUserAction,
		setCustomFieldAction,
	],
	triggers: [],
});
