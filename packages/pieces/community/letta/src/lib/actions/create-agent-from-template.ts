import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { getLettaClient } from '../common/client';
import { identityIdsDropdown } from '../common/props';
import type {
  AgentCreateParams,
  AgentCreateResponse,
} from '../common/types';

export const createAgentFromTemplate = createAction({
  auth: lettaAuth,
  name: 'createAgentFromTemplate',
  displayName: 'Create Agent From Template',
  description: 'Creates an agent from a template',
  props: {
    templateVersion: Property.ShortText({
      displayName: 'Template Version',
      description: 'The template version ID to create the agent from',
      required: true,
    }),
    agentName: Property.ShortText({
      displayName: 'Agent Name',
      description: 'The name of the agent (optional, a random name will be assigned if not provided)',
      required: false,
    }),
    identityIds: identityIdsDropdown,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to assign to the agent',
      required: false,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          description: 'Tag name',
          required: true,
        }),
      },
    }),
    memoryVariables: Property.Object({
      displayName: 'Memory Variables',
      description: 'Memory variables to assign to the agent (key-value pairs)',
      required: false,
    }),
    toolVariables: Property.Object({
      displayName: 'Tool Variables',
      description: 'Tool variables to assign to the agent (key-value pairs)',
      required: false,
    }),
    initialMessageSequence: Property.Array({
      displayName: 'Initial Message Sequence',
      description: 'Initial sequence of messages to start the agent with',
      required: false,
      properties: {
        content: Property.LongText({
          displayName: 'Content',
          description: 'Message content',
          required: true,
        }),
        role: Property.StaticDropdown({
          displayName: 'Role',
          description: 'Message role',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'User', value: 'user' },
              { label: 'System', value: 'system' },
              { label: 'Assistant', value: 'assistant' },
            ],
          },
        }),
        name: Property.ShortText({
          displayName: 'Name',
          description: 'Optional name of the participant',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const {
      templateVersion,
      agentName,
      identityIds,
      tags,
      memoryVariables,
      toolVariables,
      initialMessageSequence,
    } = context.propsValue;

    const client = getLettaClient(context.auth.props);

    const body: AgentCreateParams = {};

    if (agentName) {
      body.agent_name = agentName;
    }

    if (identityIds && identityIds.length > 0) {
      body.identity_ids = identityIds;
    }

    if (tags && tags.length > 0) {
      body.tags = tags.map((tagObj: any) => tagObj.tag).filter(Boolean);
    }

    if (memoryVariables && Object.keys(memoryVariables).length > 0) {
      const memoryVars: Record<string, string> = {};
      for (const [key, value] of Object.entries(memoryVariables)) {
        memoryVars[key] = String(value);
      }
      body.memory_variables = memoryVars;
    }

    if (toolVariables && Object.keys(toolVariables).length > 0) {
      const toolVars: Record<string, string> = {};
      for (const [key, value] of Object.entries(toolVariables)) {
        toolVars[key] = String(value);
      }
      body.tool_variables = toolVars;
    }

    if (initialMessageSequence && initialMessageSequence.length > 0) {
      body.initial_message_sequence = initialMessageSequence.map((msg: any) => ({
        content: msg.content,
        role: msg.role,
        name: msg.name || undefined,
      }));
    }

    const response: AgentCreateResponse = await client.templates.agents.create(
      templateVersion,
      body
    );

    return {
      agentIds: response.agent_ids,
      deploymentId: response.deployment_id,
      groupId: response.group_id,
      success: true,
    };
  },
});

