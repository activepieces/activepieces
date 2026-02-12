import {
	AuthenticationType,
	createCustomApiCallAction,
	httpClient,
	HttpMethod,
} from '@activepieces/pieces-common';
import {
	PieceAuth,
	createPiece,
	Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getIntercomRegion, getIntercomToken, IntercomAuthValue } from './lib/common';
import { sendMessageAction } from './lib/actions/send-message.action';
import crypto from 'node:crypto';
import { noteAddedToConversation } from './lib/triggers/note-added-to-conversation';
import { addNoteToConversationAction } from './lib/actions/add-note-to-conversation';
import { replyToConversation } from './lib/actions/reply-to-conversation';
import { newConversationFromUser } from './lib/triggers/new-conversation-from-user';
import { replyFromUser } from './lib/triggers/reply-from-user';
import { replyFromAdmin } from './lib/triggers/reply-from-admin';
import { conversationAssigned } from './lib/triggers/conversation-assigned';
import { conversationClosedTrigger } from './lib/triggers/conversation-closed';
import { conversationSnoozed } from './lib/triggers/conversation-snoozed';
import { conversationUnsnoozed } from './lib/triggers/conversation-unsnoozed';
import { conversationRated } from './lib/triggers/conversation-rated';
import { conversationPartTagged } from './lib/triggers/conversation-part-tagged';
import { findConversationAction } from './lib/actions/find-conversation';
import { addNoteToUserAction } from './lib/actions/add-note-to-user';
import { findUserAction } from './lib/actions/find-user';
import { findLeadAction } from './lib/actions/find-lead';
import { addOrRemoveTagOnConversationAction } from './lib/actions/add-remove-tag-on-conversation';
import { addOrRemoveTagOnCompanyAction } from './lib/actions/add-remove-tag-on-company';
import { createUserAction } from './lib/actions/create-user';
import { createOrUpdateUserAction } from './lib/actions/create-update-user';
import { listAllTagsAction } from './lib/actions/list-all-tags';
import { newLeadTrigger } from './lib/triggers/new-lead';
import { newCompanyTrigger } from './lib/triggers/new-company';
import { addOrRemoveTagOnContactAction } from './lib/actions/add-remove-tag-on-contact';
import { createArticleAction } from './lib/actions/create-article';
import { createConversationAction } from './lib/actions/create-conversation';
import { getConversationAction } from './lib/actions/get-conversation';
import { createOrUpdateLeadAction } from './lib/actions/create-update-lead';
import { createTicketAction } from './lib/actions/create-ticket';
import { updateTicketAction } from './lib/actions/update-ticket';
import { findCompanyAction } from './lib/actions/find-company';
import { leadAddedEmailTrigger } from './lib/triggers/lead-added-email';
import { newTicketTrigger } from './lib/triggers/new-ticket';
import { tagAddedToLeadTrigger } from './lib/triggers/tag-added-to-lead';
import { contactRepliedTrigger } from './lib/triggers/contact-replied';
import { leadConvertedToUserTrigger } from './lib/triggers/lead-converted-to-user';
import { newUserTrigger } from './lib/triggers/new-user';
import { tagAddedToUserTrigger } from './lib/triggers/tag-added-to-user';
import { contactUpdatedTrigger } from './lib/triggers/contact-updated';

const regionProp = Property.StaticDropdown({
	displayName: 'Region',
	required: true,
	options: {
		options: [
			{ label: 'US', value: 'intercom' },
			{ label: 'EU', value: 'eu.intercom' },
			{ label: 'AU', value: 'au.intercom' },
		],
	},
});

const oauthDescription = `
Please follow the instructions to create Intercom Oauth2 app.

1.Log in to your Intercom account and navigate to **Settings > Integrations > Developer Hub**.
2.Click on **Create a new app** and select the appropriate workspace.
3.In **Authentication** section, add Redirect URL.
4.In **Webhooks** section, select the events you want to receive.
5.Go to the **Basic Information** section and copy the Client ID and Client Secret.
`;

export const intercomOAuth2Auth = PieceAuth.OAuth2({
	authUrl: 'https://app.{region}.com/oauth',
	tokenUrl: 'https://api.{region}.io/auth/eagle/token',
	required: true,
	description: oauthDescription,
	scope: [],
	props: {
		region: regionProp,
	},
});

const intercomCustomAuth = PieceAuth.CustomAuth({
	displayName: 'Access Token',
	description:
		'Connect using an Intercom Access Token. You can find your token in **Settings > Integrations > Developer Hub > Your App > Authentication**.',
	required: true,
	props: {
		accessToken: PieceAuth.SecretText({
			displayName: 'Access Token',
			required: true,
		}),
		region: regionProp,
	},
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: `https://api.${auth.region}.io/me`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.accessToken,
				},
			});
			return { valid: true };
		} catch (e) {
			return { valid: false, error: (e as Error).message };
		}
	},
});

export const intercomAuth = [intercomOAuth2Auth, intercomCustomAuth];

export const intercom = createPiece({
	displayName: 'Intercom',
	description: 'Customer messaging platform for sales, marketing, and support',
	minimumSupportedRelease: '0.79.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/intercom.png',
	categories: [PieceCategory.CUSTOMER_SUPPORT],
	auth: intercomAuth,
	authors: [
		'kishanprmr',
		'MoShizzle',
		'AbdulTheActivePiecer',
		'khaledmashaly',
		'abuaboud',
		'AdamSelene',
	],
	actions: [
		addNoteToUserAction,
		addNoteToConversationAction,
		addOrRemoveTagOnContactAction,
		addOrRemoveTagOnCompanyAction,
		addOrRemoveTagOnConversationAction,
		createArticleAction,
		createConversationAction,
		createTicketAction,
		createUserAction,
		createOrUpdateLeadAction,
		createOrUpdateUserAction,
		replyToConversation,
		sendMessageAction,
		updateTicketAction,
		findCompanyAction,
		findConversationAction,
		findLeadAction,
		findUserAction,
		listAllTagsAction,
		getConversationAction,
		createCustomApiCallAction({
			baseUrl: (auth) =>
				`https://api.${getIntercomRegion(auth as IntercomAuthValue)}.io`,
			auth: intercomAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${getIntercomToken(auth as IntercomAuthValue)}`,
			}),
		}),
	],
	triggers: [
		contactRepliedTrigger,
		leadAddedEmailTrigger,
		leadConvertedToUserTrigger,
		conversationClosedTrigger,
		conversationAssigned,
		conversationSnoozed,
		conversationUnsnoozed,
		newCompanyTrigger,
		newConversationFromUser,
		conversationRated,
		newLeadTrigger,
		newTicketTrigger,
		newUserTrigger,
		conversationPartTagged,
		tagAddedToLeadTrigger,
		tagAddedToUserTrigger,
		contactUpdatedTrigger,
		replyFromUser,
		replyFromAdmin,
		noteAddedToConversation,
	],
	events: {
    parseAndReply: ({ payload }) => {
      const payloadBody = payload.body as PayloadBody;
      return {
        event: payloadBody.topic,
        identifierValue: payloadBody.app_id,
      };
    },
    verify: ({ payload, webhookSecret }) => {
      const signature = payload.headers['x-hub-signature'];
      let hmac: crypto.Hmac;
      if (typeof webhookSecret === 'string') {
        hmac = crypto.createHmac('sha1', webhookSecret);
      } else {
        const app_id = (payload.body as PayloadBody).app_id;
        const webhookSecrets = webhookSecret as Record<string, string>;
        if (!(app_id in webhookSecrets)) {
          return false;
        }
        hmac = crypto.createHmac('sha1', webhookSecrets[app_id]);
      }
      hmac.update(`${payload.rawBody}`);
      const computedSignature = `sha1=${hmac.digest('hex')}`;
      return signature === computedSignature;
    },
	},
});

type PayloadBody = {
	type: string;
	topic: string;
	id: string;
	app_id: string;
};
