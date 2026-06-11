import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const createAgent = createAction({
  auth: agentlineAuth,
  name: 'create_agent',
  displayName: 'Create Agent',
  description: 'Create a new AI voice agent',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new Agentline AI voice agent with a name, optional system prompt, greeting, and voice settings. Returns the new agent ID.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Agent Name',
      description: 'Display name for the agent',
      required: true,
    }),
    system_prompt: Property.LongText({
      displayName: 'System Prompt',
      description:
        'Default instructions for the AI voice agent. This is used for all calls unless overridden per-call.',
      required: false,
    }),
    initial_greeting: Property.ShortText({
      displayName: 'Initial Greeting',
      description:
        'What the agent says when answering inbound calls',
      required: false,
    }),
    voice_id: Property.StaticDropdown({
      displayName: 'Voice',
      description: 'Default voice for the agent',
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
      description: 'AI model tier (affects quality and speed)',
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
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
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
    if (context.propsValue.model_tier) {
      body['model_tier'] = context.propsValue.model_tier;
    }

    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.POST,
      '/v1/agents',
      body,
    );
    return response.body;
  },
});
