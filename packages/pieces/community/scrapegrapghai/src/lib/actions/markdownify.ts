import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { scrapegraphaiAuth } from '../auth';

export const markdownify = createAction({
  name: 'markdownify',
  displayName: 'Convert to Markdown',
  description: 'Convert any webpage into clean, readable Markdown format.',
  audience: 'both',
  aiMetadata: { description: 'Fetches a webpage by URL and returns its content as clean, readable Markdown. Choose this when you need the whole page as text for an LLM or document rather than a targeted extraction — use Smart Scraper instead when you want specific fields described by a prompt. Requires a public URL; read-only and safe to retry.', idempotent: true },
  auth: scrapegraphaiAuth,
  props: {
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description: 'The webpage URL to convert to Markdown',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.scrapegraphai.com/v1/markdownify',
      headers: {
        'Content-Type': 'application/json',
        'SGAI-APIKEY': auth.secret_text,
      },
      body: {
        website_url: propsValue.website_url,
      },
    });

    return response.body;
  },
}); 