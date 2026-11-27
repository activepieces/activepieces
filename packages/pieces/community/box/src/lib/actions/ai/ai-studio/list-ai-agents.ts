import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

const MODES = ['ask', 'text_gen', 'extract'];
const AGENT_STATES = ['enabled', 'disabled', 'enabled_for_selected_users'];

export const listAiAgentsAction = createAction({
  auth: boxAuth,
  name: 'box_list_ai_agents',
  displayName: 'List AI Agents',
  description: 'Lists the custom Box AI Studio agents in the enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of Box AI Studio agents with their IDs, names and access states; all modes and states unless filtered. Needs AI Studio and an admin. Page with Marker (next_marker). Pass an agent ID to Get AI Agent, Update AI Agent or as {"type": "ai_agent_id", "id": "..."} in the Box AI actions.',
    idempotent: true,
  },
  props: {
    modes: Property.StaticMultiSelectDropdown({
      displayName: 'Modes',
      description: 'Only agents with these capabilities: "ask", "text_gen", "extract". Defaults to all three.',
      required: false,
      options: { options: MODES.map((value) => ({ label: value, value })) },
    }),
    agentStates: Property.StaticMultiSelectDropdown({
      displayName: 'Agent States',
      description: 'Only agents in these states: "enabled", "disabled", "enabled_for_selected_users". Defaults to all three.',
      required: false,
      options: { options: AGENT_STATES.map((value) => ({ label: value, value })) },
    }),
    includeBoxDefault: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Include Box Default',
      description: '"true" to also return the Box default agents. Defaults to "false".',
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const modes = propsValue.modes?.length ? propsValue.modes : MODES;
    const agentStates = propsValue.agentStates?.length ? propsValue.agentStates : AGENT_STATES;
    const badMode = modes.find((mode) => !MODES.includes(mode));
    if (badMode !== undefined) {
      throw new Error(`Modes must be from: ${MODES.join(', ')}.`);
    }
    const badState = agentStates.find((state) => !AGENT_STATES.includes(state));
    if (badState !== undefined) {
      throw new Error(`Agent States must be from: ${AGENT_STATES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/ai_agents',
      query: {
        mode: modes.join(','),
        agent_state: agentStates.join(','),
        include_box_default: propsValue.includeBoxDefault,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        fields: propsValue.fields,
      },
    });
  },
});
