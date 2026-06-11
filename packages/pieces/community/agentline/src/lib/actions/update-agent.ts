import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const updateAgent = createAction({
  auth: agentlineAuth,
  name: 'update_agent',
  displayName: 'Update Agent',
  description:
    'Update an AI voice agent\'s system prompt, voice, greeting, or other settings',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates one or more settings on an Agentline voice agent. Can change the system prompt, initial greeting, voice, model tier, or name. Only provided fields are updated.',
    idempotent: true,
  },
  props: {
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The agent ID to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New display name for the agent',
      required: false,
    }),
    system_prompt: Property.LongText({
      displayName: 'System Prompt',
      description:
        'New default instructions for the AI voice agent. This is a FULL REPLACE, not an append.',
      required: false,
    }),
    initial_greeting: Property.ShortText({
      displayName: 'Initial Greeting',
      description: 'What the agent says when answering inbound calls',
      required: false,
    }),
    voice_id: Property.StaticDropdown({
      displayName: 'Voice',
      description: 'New default voice for the agent',
      required: false,
      options: {
        options: [
          { label: 'Female 1', value: 'female-1' },
          { label: 'Female 2 (Warmer)', value: 'female-2' },
          { label: 'Male 1', value: 'male-1' },
        ],
      },
    }),
    model_tier: Property.StaticDropdown({
      displayName: 'Model Tier',
      description: 'AI model tier',
      required: false,
      options: {
        options: [
          { label: 'Turbo (Fastest)', value: 'turbo' },
          { label: 'Balanced', value: 'balanced' },
          { label: 'Max (Best Quality)', value: 'max' },
        ],
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};
    if (context.propsValue.name) {
      body['name'] = context.propsValue.name;
    }
    if (context.propsValue.system_prompt) {
      body['system_prompt'] = context.propsValue.system_prompt;
    }
    if (context.propsValue.initial_greeting) {
      body['initial_greeting'] = context.propsValue.initial_greeting;
    }
    if (context.propsValue.voice_id) {
      body['voice_id'] = context.propsValue.voice_id;
    }
    if (context.propsValue.model_tier) {
      body['model_tier'] = context.propsValue.model_tier;
    }

    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.PATCH,
      `/v1/agents/${context.propsValue.agent_id}`,
      body,
    );
    return response.body;
  },
});
