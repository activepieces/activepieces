import { createPiece } from '@activepieces/pieces-framework';
import {
	webSearch,
	searchNews,
	generateImage,
	scrapeWebsite,
	crawlWebsite,
	extractDocument,
} from './lib/actions';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { dumplingAuth } from './lib/auth';

const DUMPLING_BASE_URL = 'https://app.dumplingai.com/api/v1';

export const dumplingAi = createPiece({
	displayName: 'Dumpling AI',
	description: 'Transform unstructured website content into clean, AI-ready data',
	auth: dumplingAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/dumpling-ai.png',
	authors: ['neo773'],
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
	actions: [
		webSearch,
		searchNews,
		generateImage,
		scrapeWebsite,
		crawlWebsite,
		extractDocument,
		createCustomApiCallAction({
			baseUrl: () => DUMPLING_BASE_URL,
			auth: dumplingAuth,
			authMapping: async (auth, propsValue) =>
				isDumplingUrl(propsValue['url'])
					? { Authorization: `Bearer ${auth.secret_text}` }
					: {},
			props: {
				url: {
					description: `Full URL, or a path relative to ${DUMPLING_BASE_URL}`,
					placeholder: '/scrape',
				},
			},
		}),
	],
	triggers: [],
});

function isDumplingUrl(value: unknown): boolean {
	const raw = typeof value === 'object' && value !== null && 'url' in value ? value.url : value;
	if (typeof raw !== 'string') {
		return false;
	}
	if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
		return true;
	}
	return parseOrigin(raw) === new URL(DUMPLING_BASE_URL).origin;
}

function parseOrigin(raw: string): string | null {
	try {
		return new URL(raw).origin;
	} catch {
		return null;
	}
}
