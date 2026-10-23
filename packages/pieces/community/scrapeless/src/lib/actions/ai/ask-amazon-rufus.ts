import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const askAmazonRufusAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_ask_amazon_rufus',
  displayName: 'Ask Amazon Rufus',
  description: 'Asks Amazon’s Rufus shopping assistant a question.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Asks Amazon's Rufus shopping assistant a question, optionally about one product (ASIN), and returns its answer and product suggestions. Supported marketplaces: ae, au, br, ca, de, es, fr, in, it, mx, se, tr, uk, jp, us. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    keywords: Property.ShortText({
      displayName: 'Question',
      description:
        'The question or keywords for Rufus, e.g. "best laptop for students".',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Amazon Domain',
      description: 'Amazon host, e.g. "www.amazon.com" or "www.amazon.es".',
      required: true,
    }),
    asin: Property.ShortText({
      displayName: 'ASIN',
      description: 'Product ASIN to ask about, from Search Amazon Products.',
      required: false,
    }),
    includeQuestions: Property.Checkbox({
      displayName: 'Include Suggested Questions',
      description: 'Also return the follow-up questions Rufus suggests.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.amazon',
      input: {
        type: 'rufus',
        keywords: propsValue.keywords,
        domain: propsValue.domain,
        asin: propsValue.asin,
        is_get_question: propsValue.includeQuestions,
      },
    });
  },
});
