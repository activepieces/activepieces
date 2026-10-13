import { OutputSchema } from '@activepieces/pieces-framework';

export const parseUrlActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'base_url', label: 'Base URL', format: 'url' },
    { key: 'domain', label: 'Domain' },
    { key: 'path', label: 'Path' },
    // Keys are the URL's own parameter names, so they are data, not a schema.
    { key: 'query_parameters', label: 'Query Parameters', dynamicKey: true },
    // Always present; empty when the URL carries no fragment.
    { key: 'hash', label: 'Hash' },
  ],
};
