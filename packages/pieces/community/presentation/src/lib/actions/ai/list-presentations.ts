import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationListPresentationsOutputSchema } from '../../output-schemas';

type Page = { results: unknown[] } & Record<string, unknown>;

export const listPresentations = createAction({
  auth: presentonAuth,
  name: 'presentation_list_presentations',
  outputSchema: presentationListPresentationsOutputSchema,
  displayName: 'List Presentations',
  description: 'List presentations in the Presenton account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists presentations with their ids, titles and creation times, one page at a time. Use to find the presentation id needed by presentation_export_presentation and presentation_create_integration_token. Filter by type to see only standard or smart-design decks.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'smart', label: 'Smart' },
        ],
      },
    }),
    page: Property.Number({ displayName: 'Page', required: false }),
    page_size: Property.Number({ displayName: 'Page Size', required: false }),
  },
  async run({ auth, propsValue }) {
    const { type, page, page_size } = propsValue;
    const response = await presentonClient.request<Page>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/v3/presentation/all',
      queryParams: {
        type,
        page: page === undefined ? undefined : String(page),
        page_size: page_size === undefined ? undefined : String(page_size),
      },
    });
    return { ...response, count: response.results.length };
  },
});
