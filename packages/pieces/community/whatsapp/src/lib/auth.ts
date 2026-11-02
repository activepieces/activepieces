import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `
You need the WhatsApp Business Account ID and a permanent System User access token from Meta.

1. Open [Meta for Developers](https://developers.facebook.com/) and create a **Business** app (use case **Other**).
2. Add the **WhatsApp** product to the app.
3. Go to **WhatsApp > API Setup** and copy the **WhatsApp Business Account ID**.
4. In [Meta Business Manager](https://business.facebook.com/) open **Settings > System Users**, add a system user with access to the app, and generate a permanent token with the **whatsapp_business_messaging** and **whatsapp_business_management** permissions.

Optional: to have Activepieces verify that webhook deliveries really come from Meta, also paste your **App Secret** (App settings > Basic > App Secret). Triggers then reject any request that is not signed with it.
`;

export const whatsappAuth = PieceAuth.CustomAuth({
	required: true,
	description: markdown,
	props: {
		access_token: PieceAuth.SecretText({
			displayName: 'System User Access Token',
			description: 'Permanent token of a System User with access to the app.',
			required: true,
		}),
		businessAccountId: Property.ShortText({
			displayName: 'Business Account ID',
			description: 'Found under WhatsApp > API Setup in your Meta app.',
			placeholder: '102290129340398',
			required: true,
		}),
		app_secret: PieceAuth.SecretText({
			displayName: 'App Secret',
			description: 'Optional. Your Meta app secret (App settings > Basic). When set, every webhook delivery must carry a valid X-Hub-Signature-256 or it is ignored.',
			required: false,
		}),
	},
});
