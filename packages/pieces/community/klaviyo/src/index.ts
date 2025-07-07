import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { klaviyoAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';


export const klaviyo = createPiece({
	displayName: 'Klaviyo',
	auth: klaviyoAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://www.klaviyo.com/favicon.ico',
	authors: ['yourname'],
	actions: [

		createCustomApiCallAction({
			auth: klaviyoAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => ({
				Authorization: `Klaviyo-API-Key ${auth as string}`,
			}),
		}),
	],
	triggers: [],
});

export { klaviyoAuth };
