import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { createSessionAction } from './lib/actions/create-session';
import { terminateSessionAction } from './lib/actions/terminate-session';
import { createNewBrowserWindowAction } from './lib/actions/create-new-browser-window';
import { takeScreenshotAction } from './lib/actions/take-screenshot';
import { pageQueryAction } from './lib/actions/page-query';
import { smartScrapeAction } from './lib/actions/smart-scrape';
import { paginatedExtractionAction } from './lib/actions/paginated-extraction';
import { clickAction } from './lib/actions/click-an-element';
import { typeAction } from './lib/actions/type';
import { uploadFileToSessionAction } from './lib/actions/upload-file';
import { hoverElementAction } from './lib/actions/hover-on-an-element';
import { airtopAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';

export const airtop = createPiece({
	displayName: 'Airtop',
	auth: airtopAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/airtop.png',
	authors: ['aryel780'],
	actions: [
		createSessionAction,
		terminateSessionAction,
		createNewBrowserWindowAction,
		takeScreenshotAction,
		pageQueryAction,
		smartScrapeAction,
		paginatedExtractionAction,
		clickAction,
		typeAction,
		uploadFileToSessionAction,
		hoverElementAction,
		createCustomApiCallAction({
			auth: airtopAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth}`,
				};
			},
		}),
	],
	triggers: [],
});
