import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListAutomationsOutputSchema } from '../../../output-schemas';

export const zendeskListAutomations = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_automations',
  outputSchema: zendeskListAutomationsOutputSchema,
  displayName: 'List Automations',
  description: 'List the time-based automations.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists automations, the time-based business rules that act on tickets hourly (e.g. close solved tickets after 4 days). Requires an admin.',
    idempotent: true,
  },
  props: {
    active: Property.StaticDropdown({
      displayName: 'Active',
      description: 'Filter by active (Yes) or inactive (No). Omit for both.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ automations: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/automations.json`,
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...zendeskApi.query({ active: propsValue.active }),
      },
    });
    return {
      automations: response.automations,
      count: response.automations.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
