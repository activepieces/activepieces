import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { stringWebAccessAuth } from './lib/auth';
import { STRING_API_BASE_URL } from './lib/common';
import { fetchUrl } from './lib/actions/fetch-url';
import { extractData } from './lib/actions/extract-data';
import { sendRequest } from './lib/actions/send-request';
import { searchWeb } from './lib/actions/search-web';
import { mapSiteUrls } from './lib/actions/map-site-urls';

export const stringWebAccess = createPiece({
  displayName: 'String Web Access',
  description:
    "Fetch any URL as LLM-ready Markdown, search the web, and map a site's URLs — best for pages that rate-limit or need JavaScript.",
  auth: stringWebAccessAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/string-web-access.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.DEVELOPER_TOOLS],
  authors: ['asavor'],
  actions: [
    fetchUrl,
    extractData,
    sendRequest,
    searchWeb,
    mapSiteUrls,
    createCustomApiCallAction({
      auth: stringWebAccessAuth,
      baseUrl: () => STRING_API_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
