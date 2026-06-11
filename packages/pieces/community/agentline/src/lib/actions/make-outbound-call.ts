import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const makeOutboundCall = createAction({
  auth: agentlineAuth,
  name: 'make_outbound_call',
  displayName: 'Make Outbound Call',
  description: 'Place an AI voice call to a phone number',
  audience: 'both',
  aiMetadata: {
    description:
      'Places an outbound AI voice call from an Agentline agent. The hosted AI agent handles the conversation autonomously. Requires agent_id and destination number in E.164 format. Each call is billable and not idempotent.',
    idempotent: false,
  },
  props: {
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The agent to make the call (e.g. agt_xxx)',
      required: true,
    }),
    to_number: Property.ShortText({
      displayName: 'To Number',
      description:
        'Phone number to call in E.164 format (e.g. +15558675310)',
      required: true,
    }),
    system_prompt: Property.LongText({
      displayName: 'System Prompt',
      description:
        'Custom prompt for this call only (overrides agent default). Put personality, instructions, and context here.',
      required: false,
    }),
    initial_greeting: Property.ShortText({
      displayName: 'Initial Greeting',
      description: 'What the agent says first when the person picks up',
      required: false,
    }),
    voice_id: Property.StaticDropdown({
      displayName: 'Voice',
      description: 'Voice preset for this call',
      required: false,
      options: {
        options: [
          { label: 'Female 1', value: 'female-1' },
          { label: 'Female 2 (Warmer)', value: 'female-2' },
          { label: 'Male 1', value: 'male-1' },
        ],
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      agent_id: context.propsValue.agent_id,
      to_number: context.propsValue.to_number,
    };
    if (context.propsValue.system_prompt) {
      body['system_prompt'] = context.propsValue.system_prompt;
    }
    if (context.propsValue.initial_greeting) {
      body['initial_greeting'] = context.propsValue.initial_greeting;
    }
    if (context.propsValue.voice_id) {
      body['voice_id'] = context.propsValue.voice_id;
    }

    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.POST,
      '/v1/calls',
      body,
    );
    return response.body;
  },
});
