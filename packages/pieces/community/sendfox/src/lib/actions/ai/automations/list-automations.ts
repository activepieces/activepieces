import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxListAutomationsOutputSchema } from '../../../output-schemas';

export const listAutomationsAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_list_automations',
  outputSchema: sendfoxListAutomationsOutputSchema,
  displayName: 'List Automations',
  description: 'List the automations in your SendFox account',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of automations with their IDs, titles and active state. Use it to find an automation ID for Get Automation.',
    idempotent: true,
  },
  props: {
    page: sendfoxAiProps.page({ required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/automations',
      query: {
        ...(propsValue.page !== undefined ? { page: String(propsValue.page) } : {}),
      },
    });
  },
});
