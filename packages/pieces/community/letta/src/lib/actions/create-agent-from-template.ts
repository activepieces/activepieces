import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { lettaApi } from '../common/client';
import { lettaSchemas } from '../common/schemas';
import { identityIdsDropdown } from '../common/props';
import type {
  AgentCreateParams,
  AgentCreateResponse,
} from '../common/types';

export const createAgentFromTemplate = createAction({
  auth: lettaAuth,
  name: 'createAgentFromTemplate',
  classification: 'WRITE',
  displayName: 'Create Agent From Template',
  description: 'Creates an agent from a template version (Letta Cloud only; uses Letta\'s deprecated templates endpoint)',
  audience: 'both',
  outputSchema: lettaSchemas.humanCreateFromTemplate,
  aiMetadata: { description: 'Letta Cloud only. Deploys a new stateful Letta agent from an existing template version (identified by its template version ID), optionally seeding it with a name, identities, tags, memory/tool variables, and an initial message sequence. Use to provision a fresh agent instance from a reusable blueprint. Not idempotent: each call creates a new agent (or deployment) even with identical input.', idempotent: false },
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

    const client = await lettaApi.getLettaClient({ auth: context.auth.props });

    const body: AgentCreateParams = {};

    if (agentName) {
      body.agent_name = agentName;
    }

    if (identityIds && identityIds.length > 0) {
      body.identity_ids = identityIds;
    }

    if (tags && tags.length > 0) {
      body.tags = lettaApi.toStringArray(tags) ?? [];
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
      body.initial_message_sequence = initialMessageSequence.map((msg) => toInitialMessage(msg));
    }

    const response: AgentCreateResponse = await lettaApi.callLetta(() =>
      client.templates.agents.create(templateVersion, body)
    );

    return {
      agentIds: response.agent_ids,
      deploymentId: response.deployment_id,
      groupId: response.group_id,
      success: true,
    };
  },
});


function toInitialMessage(msg: unknown): InitialMessage {
  if (!lettaApi.isRecord(msg)) {
    throw new Error('Each initial message must be an object.');
  }
  const content = msg['content'];
  const role = msg['role'];
  const name = msg['name'];
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Each initial message needs content.');
  }
  if (role !== 'user' && role !== 'system' && role !== 'assistant') {
    throw new Error('Each initial message role must be user, system or assistant.');
  }
  return {
    content,
    role,
    name: typeof name === 'string' && name.length > 0 ? name : undefined,
  };
}

type InitialMessage = NonNullable<AgentCreateParams['initial_message_sequence']>[number];
