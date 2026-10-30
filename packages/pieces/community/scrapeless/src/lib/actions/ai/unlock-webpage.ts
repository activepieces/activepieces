import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const unlockWebpageAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_unlock_webpage',
  displayName: 'Unlock Webpage',
  description:
    'Fetches a protected or JavaScript-heavy webpage through the Web Unlocker.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches a webpage through the Scrapeless Web Unlocker, which gets past anti-bot protection, and returns its HTML. Turn on Render JavaScript for single-page apps, and add JS Instructions to click, fill or wait before capture. Use Scrape URL instead for clean markdown or text from an ordinary page.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The page to fetch, e.g. "https://example.com".',
      required: true,
    }),
    renderJavaScript: Property.Checkbox({
      displayName: 'Render JavaScript',
      description:
        'Load the page in a real browser so dynamic content renders. Off by default.',
      required: false,
    }),
    jsInstructions: Property.Json({
      displayName: 'JS Instructions',
      description:
        'Browser steps run before capture when Render JavaScript is on, e.g. [{"wait_for": [".content", 30000]}, {"click": ["#load-more", 1000]}, {"fill": ["#q", "term"]}, {"wait": 1000}].',
      required: false,
    }),
    block: Property.Json({
      displayName: 'Block',
      description:
        'Resources or URLs to skip while rendering, e.g. {"resources": ["image", "font"], "urls": ["https://ads.example.com"]}.',
      required: false,
    }),
    headers: Property.Json({
      displayName: 'Headers',
      description:
        'Extra request headers as an object, e.g. {"Accept-Language": "en-US"}.',
      required: false,
    }),
    proxyCountry: Property.ShortText({
      displayName: 'Proxy Country',
      description:
        'Two-letter proxy country code, e.g. "US". Defaults to "ANY".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { jsInstructions, renderJavaScript } = propsValue;
    if (jsInstructions !== undefined && !Array.isArray(jsInstructions)) {
      throw new Error('JS Instructions must be a JSON array.');
    }
    if (jsInstructions !== undefined && !renderJavaScript) {
      throw new Error('JS Instructions need Render JavaScript turned on.');
    }
    return await scrapelessApi.unlockWebpage({
      auth,
      input: {
        url: propsValue.url,
        js_render: renderJavaScript,
        js_instructions: jsInstructions,
        block: propsValue.block,
        header: propsValue.headers,
      },
      proxyCountry: propsValue.proxyCountry ?? 'ANY',
    });
  },
});
