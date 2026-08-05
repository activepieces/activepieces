import { createAction, Property } from '@activepieces/pieces-framework';
import { parseUrlActionOutputSchema } from '../output-schemas';

export const parseUrl = createAction({
  audience: 'both',
  name: 'parse_url',
  displayName: 'Parse URL',
  description: 'Extract the domain, path, and query parameters from a URL.',
  aiMetadata: { description: 'Breaks an absolute URL string into its component parts locally, returning each query value as an array by default so repeated keys are preserved, or the first value only when that is switched off. Use it to read a value out of a link (e.g. a utm_source or a record id) before branching or composing a request; use Send HTTP Request when you need to call the URL. Requires a valid absolute URL including the scheme — no network call is made, so it is read-only and idempotent.', idempotent: true },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The full URL you want to parse (e.g., https://example.com/page?utm_source=twitter)',
      required: true,
    }),
    returnArrays: Property.Checkbox({
      displayName: 'Return Values as Arrays',
      description: 'If checked (recommended), all query parameters are returned as JSON arrays to safely group duplicate keys (e.g., {"tags": ["shoes", "hats"]}). If unchecked, standard web behavior applies, returning only the first value as text.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: parseUrlActionOutputSchema,
  async run(context) {
    const { url, returnArrays } = context.propsValue;

    try {
      const parsedUrl = new URL(url);
      const queryParams: Record<string, any> = {};

      const keys = new Set(parsedUrl.searchParams.keys());

      for (const key of keys) {
        if (returnArrays) {
          queryParams[key] = parsedUrl.searchParams.getAll(key);
        } else {
          queryParams[key] = parsedUrl.searchParams.get(key);
        }
      }

      return {
        base_url: `${parsedUrl.protocol}//${parsedUrl.host}`,
        domain: parsedUrl.hostname,
        path: parsedUrl.pathname,
        query_parameters: queryParams,
        hash: parsedUrl.hash ? parsedUrl.hash.slice(1) : '',
      };
      
    } catch (error) {
      throw new Error(`Failed to parse URL. Please ensure it is a valid, absolute URL. Details: ${(error as Error).message}`);
    }
  },
});