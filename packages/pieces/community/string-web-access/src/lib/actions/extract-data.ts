import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stringWebAccessAuth } from '../auth';
import { describeRequestError, makeRequest } from '../common';

export const extractData = createAction({
  auth: stringWebAccessAuth,
  name: 'extract_data',
  displayName: 'Extract Data From URL',
  description: 'Fetch a URL and return only the fields described by a JSON schema.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a page and extracts typed fields from it with AI, returning an object shaped by the JSON Schema you supply. Use instead of Fetch URL when the workflow needs named fields (price, title, address) rather than the whole page. The schema must be a JSON Schema object; extraction always runs against the JSON response format. Read-only and safe to repeat.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The page to extract from.',
      required: true,
    }),
    jsonSchema: Property.Json({
      displayName: 'JSON Schema',
      description:
        'The shape to extract, as a [JSON Schema](https://portal.usestring.ai/docs/fetch/structured-extraction) object. Example: `{"type":"object","properties":{"price":{"type":"string"}}}`.',
      required: true,
    }),
    executeJS: Property.Checkbox({
      displayName: 'Render JavaScript',
      description: 'Render the page in a browser before extracting. Use when the fields come back empty.',
      required: false,
      defaultValue: false,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country to route the request through.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const body: Record<string, unknown> = {
      url: propsValue.url,
      format: 'json',
      jsonSchema: propsValue.jsonSchema,
    };

    if (propsValue.executeJS) body['executeJS'] = true;
    if (propsValue.countryCode) body['countryCode'] = propsValue.countryCode;

    try {
      return await makeRequest(auth.secret_text, HttpMethod.POST, '/fetch', body);
    } catch (error: any) {
      throw describeRequestError(error, 'The fields could not be extracted from the page.');
    }
  },
});
