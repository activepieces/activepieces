import { createAction, Property } from '@activepieces/pieces-framework';

export const parseUrl = createAction({
  name: 'parse_url',
  displayName: 'Parse URL',
  description: 'Extract the domain, path, and query parameters from a URL. Automatically handles array-style parameters.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The full URL you want to parse',
      required: true,
    }),
  },
  async run(context) {
    const { url } = context.propsValue;

    try {
      const parsedUrl = new URL(url);
      const queryParams: Record<string, any> = {};

      for (const [key, value] of parsedUrl.searchParams.entries()) {
        const cleanKey = key.endsWith('[]') ? key.slice(0, -2) : key;

        if (queryParams[cleanKey] !== undefined) {
          if (Array.isArray(queryParams[cleanKey])) {
            queryParams[cleanKey].push(value);
          } else {
            queryParams[cleanKey] = [queryParams[cleanKey], value];
          }
        } else {
          queryParams[cleanKey] = value;
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
      throw new Error(`Failed to parse URL. Please ensure it is a valid, absolute URL (including http:// or https://). Details: ${(error as Error).message}`);
    }
  },
});