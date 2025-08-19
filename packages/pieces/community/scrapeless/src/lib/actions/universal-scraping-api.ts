import { createAction, Property } from '@activepieces/pieces-framework';
import { scrapelessApiAuth } from '../../index';
import { proxyCountryOptions } from '../constants';
import { createScrapelessClient } from '../services/scrapeless-api-client';

export const universalScrapingApi = createAction({
  auth: scrapelessApiAuth,
  name: 'universal_scraping_api',
  displayName: 'Universal Scraping',
  description: 'Seamlessly accesses protected or dynamic pages by handling anti-scraping systems automatically.',
  props: {
    url: Property.ShortText({
      displayName: 'Target URL',
      required: true,
    }),
    js_render: Property.Checkbox({
      displayName: 'Js Render',
      required: false,
      defaultValue: true,
    }),
    headless: Property.Checkbox({
      displayName: 'Headless',
      required: false,
      defaultValue: true,
    }),
    country: Property.StaticDropdown({
      displayName: 'Country',
      required: false,
      defaultValue: 'ANY',
      options: {
        options: proxyCountryOptions,
      },
    }),
    js_instructions: Property.Json({
      displayName: 'Js Instructions',
      required: false,
      defaultValue: [{ "wait": 1000 }],
    }),
    block: Property.Json({
      displayName: 'Block',
      required: false,
      defaultValue: { "resources": ["image", "font", "script"], "urls": ["https://example.com"] },
    }),
  },

  async run({ propsValue, auth }) {
    try {
      const client = createScrapelessClient(auth);

      const input = {
        url: propsValue.url,
        js_render: propsValue.js_render,
        headless: propsValue.headless,
        js_instructions: propsValue.js_instructions,
        block: propsValue.block,
      }

      const proxy = {
        country: propsValue.country,
      }

      const response = await client.universal.scrape({
        actor: 'unlocker.webunlocker',
        input,
        proxy,
      })

      return {
        success: true,
        data: response || null,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
      }
    }
  },
});
