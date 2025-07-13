import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { placidAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';
import { convertFileToUrlAction } from './lib/actions/convert-file-to-url';
import { createImageAction } from './lib/actions/create-image';
import { createPdfAction } from './lib/actions/create-pdf';
import { getImageAction } from './lib/actions/get-image';
import { get } from 'http';
import { getPdfAction } from './lib/actions/get-pdf';
import { getVideoAction } from './lib/actions/get-video';
import { newImageTrigger } from './lib/triggers/new-image';
import { newPdfTrigger } from './lib/triggers/new-pdf';
import { newVideoTrigger } from './lib/triggers/new-video';

export const placid = createPiece({
	displayName: 'Placid',
	auth: placidAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/placid.png',
	authors: ['aryel780'],
	actions: [
    convertFileToUrlAction,
    createImageAction,
    createPdfAction,
    getImageAction,
    getPdfAction,
    getVideoAction,
		createCustomApiCallAction({
			auth: placidAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth as string}`,
				};
			},
		}),
	],
	triggers: [newImageTrigger, newPdfTrigger, newVideoTrigger],
});
