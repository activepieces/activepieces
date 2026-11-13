import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxClient } from '../../../common/client';
import { sendfoxGetAutomationOutputSchema } from '../../../output-schemas';

export const getAutomationAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_get_automation',
  outputSchema: sendfoxGetAutomationOutputSchema,
  displayName: 'Get Automation',
  description: 'Get one SendFox automation',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one automation by ID with its title, active state, triggers and steps. Automation IDs come from List Automations.',
    idempotent: true,
  },
  props: {
    automationId: Property.ShortText({
      displayName: 'Automation ID',
      description: 'ID of an automation, e.g. "9876". Use List Automations to find it.',
      required: true,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/automations/${encodeURIComponent(propsValue.automationId)}`,
    });
  },
});
