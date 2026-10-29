import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationListStandardTemplatesOutputSchema } from '../../output-schemas';

type Page = { items: unknown[] } & Record<string, unknown>;

export const listStandardTemplates = createAction({
  auth: presentonAuth,
  name: 'presentation_list_standard_templates',
  outputSchema: presentationListStandardTemplatesOutputSchema,
  displayName: 'List Standard Templates',
  description: 'List standard presentation templates.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists standard templates with their ids and names, one page at a time. Use the id as standard_template in presentation_generate_presentation or presentation_create_presentation_from_json, or in presentation_get_standard_template.',
    idempotent: true,
  },
  props: {
    page: Property.Number({ displayName: 'Page', required: false }),
    page_size: Property.Number({ displayName: 'Page Size', required: false }),
    default: Property.Checkbox({ displayName: 'Default Templates Only', required: false }),
  },
  async run({ auth, propsValue }) {
    const { page, page_size } = propsValue;
    const response = await presentonClient.request<Page>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/v3/standard-template/all',
      queryParams: {
        page: page === undefined ? undefined : String(page),
        page_size: page_size === undefined ? undefined : String(page_size),
        default: propsValue.default ? 'true' : undefined,
      },
    });
    return { ...response, count: response.items.length };
  },
});
