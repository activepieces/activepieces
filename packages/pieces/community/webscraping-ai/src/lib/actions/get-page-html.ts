import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const getPageHtml = createAction({
  auth: webscrapingAiAuth,
  name: 'getPageHtml',
  displayName: 'Get Page HTML',
  description: 'Retrieves the raw HTML markup of a web page.',
  props: webscrapingAiCommon.getPageHtmlProperties,
  async run({ auth: apiKey, propsValue }) {
    return await webscrapingAiCommon.getPageHtml({ apiKey, ...propsValue });
  },
});
