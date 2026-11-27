import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

const ACCESS_STATES = ['enabled', 'disabled', 'enabled_for_selected_users'];

export const createAiAgentAction = createAction({
  auth: boxAuth,
  name: 'box_create_ai_agent',
  displayName: 'Create AI Agent',
  description: 'Creates a custom Box AI Studio agent.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Box AI Studio agent with a name, access state and at least one capability config (Ask, Text Gen or Extract), and returns its ID. Needs AI Studio and an admin. Start from Get AI Agent Default Config for capability configs; use the returned ID in the Box AI actions as {"type": "ai_agent_id", "id": "..."}.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Name of the agent.', required: true }),
    accessState: Property.StaticDropdown({
      displayName: 'Access State',
      description: '"enabled", "disabled" or "enabled_for_selected_users" (then give Allowed Entities).',
      required: true,
      options: { options: ACCESS_STATES.map((value) => ({ label: value, value })) },
    }),
    allowedEntities: Property.Json({
      displayName: 'Allowed Entities',
      description: 'Users and groups who can use the agent when "enabled_for_selected_users": [{"type": "user", "id": "123"}, {"type": "group", "id": "456"}].',
      required: false,
    }),
    iconReference: Property.ShortText({
      displayName: 'Icon Reference',
      description: 'Icon URL "https://cdn01.boxcdn.net/app-assets/aistudio/avatars/<file>", where <file> is one of logo_boxAi.png, logo_stamp.png, logo_legal.png, logo_finance.png, logo_config.png, logo_handshake.png, logo_analytics.png, logo_classification.png.',
      required: false,
    }),
    ask: Property.Json({
      displayName: 'Ask',
      description: 'Ask capability: {"type": "ai_agent_ask", "access_state": "enabled", "description": "...", "custom_instructions": "..."}, optionally with tool configs like long_text and basic_text.',
      required: false,
    }),
    textGen: Property.Json({
      displayName: 'Text Gen',
      description: 'Text generation capability: {"type": "ai_agent_text_gen", "access_state": "enabled", "description": "...", "custom_instructions": "..."}.',
      required: false,
    }),
    extract: Property.Json({
      displayName: 'Extract',
      description: 'Extract capability: {"type": "ai_agent_extract", "access_state": "enabled", "description": "...", "custom_instructions": "..."}.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!ACCESS_STATES.includes(propsValue.accessState)) {
      throw new Error(`Access State must be one of: ${ACCESS_STATES.join(', ')}.`);
    }
    if (propsValue.ask === undefined && propsValue.textGen === undefined && propsValue.extract === undefined) {
      throw new Error('Give at least one of Ask, Text Gen or Extract.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/ai_agents',
      body: {
        type: 'ai_agent',
        name: propsValue.name,
        access_state: propsValue.accessState,
        ...(propsValue.allowedEntities !== undefined ? { allowed_entities: propsValue.allowedEntities } : {}),
        ...(propsValue.iconReference !== undefined ? { icon_reference: propsValue.iconReference } : {}),
        ...(propsValue.ask !== undefined ? { ask: propsValue.ask } : {}),
        ...(propsValue.textGen !== undefined ? { text_gen: propsValue.textGen } : {}),
        ...(propsValue.extract !== undefined ? { extract: propsValue.extract } : {}),
      },
    });
  },
});
