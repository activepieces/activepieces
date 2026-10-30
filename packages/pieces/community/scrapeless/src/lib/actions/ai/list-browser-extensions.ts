import { createAction } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const listBrowserExtensionsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_list_browser_extensions',
  displayName: 'List Browser Extensions',
  description: 'Lists the uploaded browser extensions.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every uploaded browser extension with its extensionId, name and version, for Create Browser Session.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await scrapelessApi.listBrowserExtensions({ auth });
  },
});
