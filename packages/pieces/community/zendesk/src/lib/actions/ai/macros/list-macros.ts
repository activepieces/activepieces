import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListMacrosOutputSchema } from '../../../output-schemas';

export const zendeskListMacros = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_macros',
  outputSchema: zendeskListMacrosOutputSchema,
  displayName: 'List Macros',
  description: 'List the macros available to the connected agent.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists macros, the canned responses and field changes agents apply to tickets, with their actions. Use Search Macros to find one by title, then Preview Macro on Ticket to see its effect.',
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
      description: 'Only return macros with this visibility.',
      required: false,
      options: { options: [{ label: 'Personal', value: 'personal' }, { label: 'Agents', value: 'agents' }, { label: 'Shared', value: 'shared' }, { label: 'Account', value: 'account' }] },
    }),
    group_id: Property.ShortText({ displayName: 'Group ID', description: 'Only return macros available to this group, from List Groups.', required: false }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ macros: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/macros.json`,
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...zendeskApi.query({ active: propsValue.active, access: propsValue.access, group_id: propsValue.group_id }),
      },
    });
    return {
      macros: response.macros,
      count: response.macros.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
