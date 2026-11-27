import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const ACCESS_STATES = ['enabled', 'disabled', 'enabled_for_selected_users'];

export const updateAiAgentAction = createAction({
  auth: boxAuth,
  name: 'box_update_ai_agent',
  displayName: 'Update AI Agent',
  description: 'Changes a Box AI Studio agent.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a Box AI Studio agent\'s name, access state, icon, allowed users and groups, or capability configs; only the fields given change, and a capability given replaces that whole capability config. Set Access State "disabled" to turn an agent off without deleting it. Needs AI Studio and an admin. Get the agent ID from List AI Agents.',
    idempotent: true,
  },
  props: {
    agentId: boxAiProps.aiAgentId({ required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'New name of the agent.', required: false }),
    accessState: Property.StaticDropdown({
      displayName: 'Access State',
      description: '"enabled", "disabled" or "enabled_for_selected_users".',
      required: false,
      options: { options: ACCESS_STATES.map((value) => ({ label: value, value })) },
    }),
    allowedEntities: Property.Json({
      displayName: 'Allowed Entities',
      description: 'The full new list of users and groups: [{"type": "user", "id": "123"}, {"type": "group", "id": "456"}].',
      required: false,
    }),
    iconReference: Property.ShortText({
      displayName: 'Icon Reference',
      description: 'Icon URL "https://cdn01.boxcdn.net/app-assets/aistudio/avatars/<file>", e.g. logo_boxAi.png or logo_legal.png.',
      required: false,
    }),
    ask: Property.Json({
      displayName: 'Ask',
      description: 'New ask capability config: {"type": "ai_agent_ask", "access_state": "enabled", "description": "..."}.',
      required: false,
    }),
    textGen: Property.Json({
      displayName: 'Text Gen',
      description: 'New text generation capability config: {"type": "ai_agent_text_gen", "access_state": "enabled", "description": "..."}.',
      required: false,
    }),
    extract: Property.Json({
      displayName: 'Extract',
      description: 'New extract capability config: {"type": "ai_agent_extract", "access_state": "enabled", "description": "..."}.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.accessState !== undefined && !ACCESS_STATES.includes(propsValue.accessState)) {
      throw new Error(`Access State must be one of: ${ACCESS_STATES.join(', ')}.`);
    }
    const changes = {
      ...(propsValue.allowedEntities !== undefined ? { allowed_entities: propsValue.allowedEntities } : {}),
      ...(propsValue.iconReference !== undefined ? { icon_reference: propsValue.iconReference } : {}),
      ...(propsValue.ask !== undefined ? { ask: propsValue.ask } : {}),
      ...(propsValue.textGen !== undefined ? { text_gen: propsValue.textGen } : {}),
      ...(propsValue.extract !== undefined ? { extract: propsValue.extract } : {}),
    };
    if (propsValue.name === undefined && propsValue.accessState === undefined && Object.keys(changes).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    const path = `/ai_agents/${encodeURIComponent(propsValue.agentId)}`;
    const current =
      propsValue.name !== undefined && propsValue.accessState !== undefined
        ? { name: propsValue.name, access_state: propsValue.accessState }
        : await boxClient.request<AiAgentNameAndState>({ auth, method: HttpMethod.GET, path, query: { fields: 'name,access_state' } });
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path,
      body: {
        type: 'ai_agent',
        name: propsValue.name ?? current.name,
        access_state: propsValue.accessState ?? current.access_state,
        ...changes,
      },
    });
  },
});

type AiAgentNameAndState = { name: string; access_state: string };
