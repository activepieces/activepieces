import { createAction, Property } from '@activepieces/pieces-framework';
import { WebScrapingAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const extractStructuredData = createAction({
  auth: WebScrapingAuth,
  name: "extract_structured_data",
  displayName: "Extract Structured Data",
  description: "Extract structured fields from a webpage using LLM.",
  props: {
    url: Property.ShortText({
      displayName: "Page URL",
      required: true,
    }),
    fields: Property.Json({
      displayName: "Fields",
      description: `Provide JSON mapping of field names to CSS selectors.

Example:
{
  "title": "h1",
  "price": ".price_color",
  "availability": ".instock.availability"
}`,
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const fields: Record<string, string> = Object.fromEntries(
      Object.entries(propsValue.fields as Record<string, unknown>)
        .map(([k, v]) => [k, String(v)])
    );

    const queryParams: Record<string, any> = {
      url: propsValue.url,
    };

    for (const [key, value] of Object.entries(fields)) {
      queryParams[`fields[${key}]`] = value;
    }

    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/ai/fields`,
      queryParams,
      undefined
    );

    return response;
  }

});
