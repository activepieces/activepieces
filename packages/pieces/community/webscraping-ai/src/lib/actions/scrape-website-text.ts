import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const scrapeWebsiteText = createAction({
  auth: webscrapingAiAuth,
  name: 'scrapeWebsiteText',
  displayName: 'Scrape Website Text',
  description:
    'Returns the visible text content of a webpage specified by the URL.',
  props: webscrapingAiCommon.getPageTextProperties,
  async run({ auth: apiKey, propsValue }) {
    return await webscrapingAiCommon.getPageText({
      apiKey,
      ...propsValue,
    });
  },
});
