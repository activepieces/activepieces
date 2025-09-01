import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const extractStructuredData = createAction({
  auth: webscrapingAiAuth,
  name: 'extractStructuredData',
  displayName: 'Extract structured data',
  description: 'Returns structured data fields extracted from the webpage using an LLM model.',
  props: webscrapingAiCommon.getPageStructuredDataProperties,
  async run({auth: apiKey, propsValue}) {
    return await webscrapingAiCommon.getPageStructuredData({apiKey, ...propsValue});
  },
});
