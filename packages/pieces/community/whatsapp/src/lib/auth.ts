import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `
To Obtain a Phone Number ID and a Permanent System User Access Token, follow these steps:

1. Go to https://developers.facebook.com/
2. Make a new app, Select Other for usecase.
3. Choose Business as the type of app.
4. Add new Product -> WhatsApp.
5. Navigate to WhatsApp Settings > API Setup.
6. Copy the Business Account ID.
7. Login to your [Meta Business Manager](https://business.facebook.com/).
8. Click on Settings.
9. Create a new System User with access over the app and copy the access token.

Optional: to have Activepieces verify that webhook deliveries really come from Meta, also paste your **App Secret** (App settings > Basic > App Secret). Triggers then reject any request that is not signed with it.
`;

export const whatsappAuth = PieceAuth.CustomAuth({
	required: true,
	description: markdown,
	props: {
		access_token: PieceAuth.SecretText({
			displayName: 'System User Access Token',
			description: 'The system user access token of your WhatsApp business account.',
			required: true,
		}),
		businessAccountId: Property.ShortText({
			displayName: 'Business Account ID',
			description: 'The business account ID of your WhatsApp business account.',
			required: true,
		}),
		app_secret: PieceAuth.SecretText({
			displayName: 'App Secret',
			description: 'Optional. Your Meta app secret (App settings > Basic). When set, every webhook delivery must carry a valid X-Hub-Signature-256 or it is ignored.',
			required: false,
		}),
	},
});
