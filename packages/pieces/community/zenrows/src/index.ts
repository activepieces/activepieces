import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { generatedActions } from './lib/actions/generated';
import { scrapeUrlAction } from './lib/actions/scrape-url';
import { zenrowsAuth } from './lib/auth';
import { ZENROWS_API_BASE_URL, ZENROWS_API_HOSTS, zenrowsClient } from './lib/common/client';

export const zenrows = createPiece({
  displayName: 'Zenrows',
  description:
    "Live web data: fetch any public page as Markdown, HTML or text, pull structured fields from it as JSON, run batch jobs over many URLs, crawl a site from one start URL and drive a hosted browser for pages that need clicks, forms or pagination, with proxies, JavaScript rendering and anti-bot protection handled by Zenrows.",
  auth: zenrowsAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/zenrows.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
  authors: ['imoital'],
  actions: [
    scrapeUrlAction,
    ...generatedActions,
    createCustomApiCallAction({
      baseUrl: () => ZENROWS_API_BASE_URL,
      auth: zenrowsAuth,
      authMapping: async (auth, propsValue) =>
        zenrowsClient.apiKeyHeaderFor({
          apiKey: auth.secret_text,
          url: propsValue['url'],
          followRedirects: propsValue['followRedirects'],
        }),
      props: {
        url: {
          description: `A path relative to ${ZENROWS_API_BASE_URL}, e.g. /subscriptions/self/details, or a full URL on ${ZENROWS_API_HOSTS.join(' or ')}. The API key is sent in the X-API-Key header, and only to those hosts.`,
        },
      },
    }),
  ],
  triggers: [],
});
