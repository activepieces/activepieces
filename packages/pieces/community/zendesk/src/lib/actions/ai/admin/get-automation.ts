import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetAutomationOutputSchema } from '../../../output-schemas';

export const zendeskGetAutomation = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_automation',
  outputSchema: zendeskGetAutomationOutputSchema,
  displayName: 'Get Automation',
  description: 'Get an automation by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one automation with its conditions and actions. Requires an admin.',
    idempotent: true,
  },
  props: {
    automation_id: zendeskAiProps.requiredId({ displayName: 'Automation ID', description: 'Numeric automation ID, from List or Search Automations.' }),
  },
  async run({ auth, propsValue }) {
    const automationId = zendeskApi.id({ value: propsValue.automation_id, label: 'Automation ID' });
    const response = await zendeskApi.request<{ automation: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/automations/${automationId}.json`,
    });
    return response.automation;
  },
});
