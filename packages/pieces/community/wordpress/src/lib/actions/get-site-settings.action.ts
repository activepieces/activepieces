import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { getSiteSettingsOutputSchema } from '../output-schemas';

export const getSiteSettingsAction = createAction({
  auth: wordpressAuth,
  name: 'get_site_settings',
  classification: 'READ',
  displayName: 'Get Site Settings',
  description: 'Gets the site title, tagline, URL, timezone, date format and reading settings.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the WordPress site settings: title, tagline, URL, admin email, timezone, date and time formats, default category and post format, and front-page setup. Use it to learn the site timezone before scheduling a post, or the default category ID. Needs an Administrator connection. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getSiteSettingsOutputSchema,
  props: {},
  async run({ auth }) {
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.GET,
      path: '/settings',
    });
    return response.body;
  },
});
