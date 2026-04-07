import { createAction, Property } from '@activepieces/pieces-framework';

export const parseUrl = createAction({
  name: 'parse_url',
  displayName: 'Parse URL',
  description: 'Extract the domain, path, and query parameters from a URL.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The full URL you want to parse (e.g., https://example.com/page?utm_source=twitter)',
      required: true,
    }),
    returnArrays: Property.Checkbox({
      displayName: 'Return Values as Arrays',
      description: 'If checked, duplicate query parameters are returned as a JSON array (e.g., {"tags": ["shoes", "hats"]}). If unchecked, they are joined into a single comma-separated string (e.g., {"tags": "shoes, hats"}).',
      required: false,
      defaultValue: false,
    }),
  },
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
        hash: parsedUrl.hash,
      };
      
    } catch (error) {
      throw new Error(`Failed to parse URL. Please ensure it is a valid, absolute URL. Details: ${(error as Error).message}`);
    }
  },
});