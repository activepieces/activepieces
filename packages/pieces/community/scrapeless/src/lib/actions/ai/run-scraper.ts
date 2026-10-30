import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const runScraperAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_run_scraper',
  displayName: 'Run Scraper',
  description: 'Runs any Scrapeless scraper actor with a raw input object.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Runs any Scrapeless scraper actor (e.g. "scraper.google.search", "scraper.amazon", "scraper.consopt") with its raw input object. Prefer the dedicated search and get actions; use this for actors they don’t cover. With Run Asynchronously, or when the scrape hasn’t finished, completed is false and taskId goes to Get Scraper Result. Each run uses credits.',
    idempotent: false,
  },
  props: {
    actor: Property.ShortText({
      displayName: 'Actor',
      description: 'Scraper actor name, e.g. "scraper.google.search".',
      required: true,
    }),
    input: Property.Json({
      displayName: 'Input',
      description:
        'The actor’s input object, e.g. {"q": "coffee", "gl": "us"}.',
      required: true,
    }),
    proxyCountry: Property.ShortText({
      displayName: 'Proxy Country',
      description:
        'Two-letter proxy country code, e.g. "US", or "ANY". Some actors require it.',
      required: false,
    }),
    runAsync: Property.Checkbox({
      displayName: 'Run Asynchronously',
      description:
        'Return a taskId immediately instead of waiting for the result.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { input } = propsValue;
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('Input must be a JSON object.');
    }
    return await scrapelessApi.runScraper({
      auth,
      actor: propsValue.actor,
      input: { ...input },
      proxyCountry: propsValue.proxyCountry,
      runAsync: propsValue.runAsync ?? false,
    });
  },
});
