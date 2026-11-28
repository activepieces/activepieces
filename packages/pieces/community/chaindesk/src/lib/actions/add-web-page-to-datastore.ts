import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { chaindeskAuth } from '../common/auth';
import { BASE_URL } from '../common/constants';
import { chaindeskOutputSchemas } from '../common/output-schemas';
import { withUsageLimitHint } from '../common/errors';
import { datastoreIdDropdown } from '../common/props';

export const addWebPageToDatastoreAction = createAction({
  auth: chaindeskAuth,
  name: 'add-web-page-to-datastore',
  displayName: 'Add Web Page to Datastore',
  description:
    'Adds a web page or a whole website (sitemap) as a new datasource in a datastore.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a public URL as a new datasource in a specific Chaindesk (Askli) datastore: either a single web page, or a whole website given by its sitemap URL. The vendor fetches and ingests the content asynchronously; check progress with Get Datasource. Not idempotent: each call creates another datasource.',
    idempotent: false,
  },
  props: {
    datastoreId: datastoreIdDropdown,
    type: Property.StaticDropdown({
      displayName: 'Source Type',
      required: true,
      defaultValue: 'web_page',
      options: {
        disabled: false,
        options: [
          { label: 'Single web page', value: 'web_page' },
          { label: 'Website (sitemap URL)', value: 'web_site' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'The page URL, or the sitemap URL when Source Type is Website.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Optional name for this datasource.',
      required: false,
    }),
  },
  outputSchema: chaindeskOutputSchemas.datasource,
  async run(context) {
    const { datastoreId, type, url, name } = context.propsValue;
    const trimmedUrl = url.trim();
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      throw new Error('URL must start with http:// or https://');
    }
    if (type !== 'web_page' && type !== 'web_site') {
      throw new Error('Source Type must be web_page or web_site.');
    }
    const trimmedName = name?.trim();
    const response = await withUsageLimitHint(() =>
      httpClient.sendRequest({
        method: HttpMethod.POST,
        url: BASE_URL + '/datasources',
        redactBodyInErrors: true,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
        body: {
          type,
          datastoreId,
          name: trimmedName ? trimmedName : undefined,
          config: buildConfig({ type, url: trimmedUrl }),
        },
      })
    );
    return response.body;
  },
});

function buildConfig({ type, url }: { type: string; url: string }) {
  if (type === 'web_site') {
    return { sitemap: url };
  }
  return { source_url: url };
}
