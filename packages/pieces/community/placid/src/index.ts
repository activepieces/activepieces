import {
	AuthenticationType,
	HttpMethod,
	createCustomApiCallAction,
	httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createImage } from './lib/actions/create-image';
import { createPdf } from './lib/actions/create-pdf';
import { createVideo } from './lib/actions/create-video';
import { convertFileToUrl } from './lib/actions/convert-file-to-url';
import { getImage } from './lib/actions/get-image';
import { getPdf } from './lib/actions/get-pdf';
import { getVideo } from './lib/actions/get-video';
import { PLACID_BASE_URL } from './lib/common';

export const placidAuth = PieceAuth.SecretText({
	description: `
To obtain your Placid API token:

1. Log in to [placid.app](https://placid.app/login).
2. Go to Projects overview.
3. Select your desired project.
4. Click "API Tokens" in the left menu.
5. Copy your API token.

The token is project-specific and will only work with templates from that project.`,
	displayName: 'API Token',
	required: true,
	validate: async (auth) => {
		try {
			await httpClient.sendRequest({
				url: `${PLACID_BASE_URL}/templates`,
				method: HttpMethod.GET,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.auth as string,
				},
			});
			return {
				valid: true,
			};
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid API token or failed to connect to Placid API',
			};
		}
	},
});

export const placid = createPiece({
	displayName: 'Placid',
	description:
		'Creative automation engine that generates dynamic images, PDFs, and videos from templates and data.',
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/placid.png',
	categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.MARKETING],
	auth: placidAuth,
	actions: [
		createImage,
		createPdf,
		createVideo,
		convertFileToUrl,
		getImage,
		getPdf,
		getVideo,
		createCustomApiCallAction({
			auth: placidAuth,
			baseUrl: () => PLACID_BASE_URL,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${auth}`,
			}),
		}),
	],
	triggers: [],
	authors: ['MAVRICK-1'],
});
