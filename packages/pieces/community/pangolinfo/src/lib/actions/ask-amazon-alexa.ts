import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pangolinfoAuth } from '../auth';
import { pangolinfoClient } from '../common';

const askAmazonAlexa = createAction({
  name: 'ask_amazon_alexa',
  displayName: 'Ask Amazon Alexa for Shopping',
  description:
    'Retrieve Alexa for Shopping recommendations, recommended ASINs, answers, and follow-up questions.',
  audience: 'both',
  aiMetadata: {
    description:
      'Asks Alexa for Shopping a product-discovery question. Use for Amazon AEO, recommendation monitoring, conversational commerce research, and competitor visibility analysis. Read-only and idempotent.',
    idempotent: true,
  },
  auth: pangolinfoAuth,
  props: {
    prompt: Property.LongText({
      displayName: 'Shopping Question',
      description: 'Natural-language product discovery request.',
      required: true,
    }),
    screenshot: Property.Checkbox({
      displayName: 'Include Screenshot',
      description: 'Include a visual screenshot when supported.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { prompt, screenshot } = context.propsValue;
    return pangolinfoClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v2/scrape',
      body: {
        parserName: 'amazonAlexa',
        param: [prompt],
        url: 'https://www.amazon.com/',
        screenshot: screenshot ?? false,
      },
    });
  },
});

export { askAmazonAlexa };
