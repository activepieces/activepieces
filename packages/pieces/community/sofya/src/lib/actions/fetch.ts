import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sofyaAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const fetchAction = createAction({
  name: 'fetch',
  displayName: 'Fetch URL Content',
  description: 'Fetch URLs and return clean markdown. Supports web pages, PDFs, and documents.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one or more URLs and return their content as clean markdown (also supports PDFs and documents). Use when you already have exact URLs (e.g. from a prior search) and need their full text rather than running a new query. Costs 1 credit per URL, up to 10 URLs; failed URLs are not charged. Read-only and idempotent.',
    idempotent: true,
  },
  auth: sofyaAuth,
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'The URLs to fetch (max 10).',
      required: true,
    }),
    include_raw_html: Property.Checkbox({
      displayName: 'Include Raw HTML',
      description: 'Also include the raw HTML source in each result (null for non-HTML content such as PDFs).',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await makeRequest({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/fetch',
      body: {
        urls: propsValue.urls,
        include_raw_html: propsValue.include_raw_html,
      },
    });
  },
});
