import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { googleTranslateAuth } from '../auth';
import { googleTranslateClient } from '../common/client';

export const customApiCallAction = createCustomApiCallAction({
	auth: googleTranslateAuth,
	baseUrl: () => googleTranslateClient.baseUrl(),
	authMapping: async (auth, propsValue) => {
		const url: string = propsValue['url']?.['url'] ?? '';
		const baseUrl = googleTranslateClient.baseUrl();
		if (/^https?:\/\//.test(url) && new URL(url).origin !== baseUrl) {
			throw new Error(
				`Custom API Call only sends your Google credentials to ${baseUrl}. Use a path relative to it (e.g. /language/translate/v2/languages) or a full URL on that host.`,
			);
		}
		return { Authorization: `Bearer ${auth.access_token}` };
	},
});
