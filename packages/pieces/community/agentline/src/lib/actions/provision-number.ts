import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const provisionNumber = createAction({
  auth: agentlineAuth,
  name: 'provision_number',
  displayName: 'Provision Phone Number',
  description: 'Buy and assign a US phone number to an agent ($2.00 per number)',
  audience: 'both',
  aiMetadata: {
    description:
      'Provisions (buys) a new US phone number and attaches it to an Agentline agent. Costs $2.00 per number. Numbers are permanent once provisioned. Not idempotent.',
    idempotent: false,
  },
  props: {
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The agent to attach the number to',
      required: true,
    }),
    area_code: Property.ShortText({
      displayName: 'Area Code',
      description:
        'Preferred 3-digit US area code (e.g. 212 for NYC, 415 for SF)',
      required: false,
    }),
    number_type: Property.StaticDropdown({
      displayName: 'Number Type',
      description: 'Type of phone number',
      required: false,
      options: {
        options: [
          { label: 'Local', value: 'local' },
          { label: 'Toll-Free', value: 'tollfree' },
        ],
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      agent_id: context.propsValue.agent_id,
      country: 'US',
    };
    if (context.propsValue.area_code) {
      body['area_code'] = context.propsValue.area_code;
    }
    if (context.propsValue.number_type) {
      body['number_type'] = context.propsValue.number_type;
    }

    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.POST,
      '/v1/numbers',
      body,
    );
    return response.body;
  },
});
