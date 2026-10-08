import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationListSmartDesignsOutputSchema } from '../../output-schemas';

type Page = { results: unknown[] } & Record<string, unknown>;

export const listSmartDesigns = createAction({
  auth: presentonAuth,
  name: 'presentation_list_smart_designs',
  outputSchema: presentationListSmartDesignsOutputSchema,
  displayName: 'List Smart Designs',
  description: 'List Smart Designs available to the account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Smart Designs with their ids, one page at a time. Use the id as smart_design in presentation_generate_presentation.',
    idempotent: true,
  },
  props: {
    default: Property.Checkbox({ displayName: 'Default Designs Only', required: false }),
    page: Property.Number({ displayName: 'Page', required: false }),
    page_size: Property.Number({ displayName: 'Page Size', required: false }),
  },
  async run({ auth, propsValue }) {
    const { page, page_size } = propsValue;
    const response = await presentonClient.request<Page>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/v3/smart-design/all',
      queryParams: {
        default: propsValue.default ? 'true' : undefined,
        page: page === undefined ? undefined : String(page),
        page_size: page_size === undefined ? undefined : String(page_size),
      },
    });
    return { ...response, count: response.results.length };
  },
});
