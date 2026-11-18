import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListTicketTriggersOutputSchema } from '../../../output-schemas';

export const zendeskListTicketTriggers = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_ticket_triggers',
  outputSchema: zendeskListTicketTriggersOutputSchema,
  displayName: 'List Ticket Triggers',
  description: 'List the ticket triggers.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists ticket triggers, the business rules that run when tickets are created or updated, with their conditions and actions. Use it to explain why a ticket changed. Requires an admin.',
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
    const response = await zendeskApi.request<{ triggers: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/triggers.json`,
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...zendeskApi.query({ active: propsValue.active }),
      },
    });
    return {
      triggers: response.triggers,
      count: response.triggers.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
