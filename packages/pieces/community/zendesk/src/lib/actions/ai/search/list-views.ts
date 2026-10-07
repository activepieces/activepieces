import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListViewsOutputSchema } from '../../../output-schemas';

export const zendeskListViews = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_views',
  outputSchema: zendeskListViewsOutputSchema,
  displayName: 'List Views',
  description: 'List the ticket views available to the connected agent.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists ticket views, the saved ticket filters agents work from, with their conditions. Use a view ID with List View Tickets or Count View Tickets.',
    idempotent: true,
  },
  props: {
    active: Property.StaticDropdown({
      displayName: 'Active',
      description: 'Filter by active (Yes) or inactive (No). Omit for both.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    }),
    access: Property.StaticDropdown({
      displayName: 'Access',
      description: 'Only return views with this visibility.',
      required: false,
      options: { options: [{ label: 'Personal', value: 'personal' }, { label: 'Shared', value: 'shared' }, { label: 'Account', value: 'account' }] },
    }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ views: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/views.json`,
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...zendeskApi.query({ active: propsValue.active, access: propsValue.access }),
      },
    });
    return {
      views: response.views,
      count: response.views.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
