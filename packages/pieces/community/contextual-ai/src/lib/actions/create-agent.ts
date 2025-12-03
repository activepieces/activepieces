import { createAction, Property } from "@activepieces/pieces-framework";
import { contextualAiAuth } from "../../index";
import { ContextualAI } from 'contextual-client';
import type { Datastore } from 'contextual-client/resources/datastores';

export const createAgentAction = createAction({
  auth: contextualAiAuth,
  name: 'create_agent',
  displayName: 'Create Agent',
  description: 'Create a new Contextual AI agent with specified configuration',
  props: {
    name: Property.ShortText({
      displayName: 'Agent Name',
      description: 'Name for the new agent',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Optional description of the agent',
      required: false,
    }),
    datastoreIds: Property.MultiSelectDropdown({
      auth: contextualAiAuth,
      displayName: 'Datastores',
      description: 'Select datastores to associate with this agent (leave empty to create new datastore)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          if (!auth) {
            return {
              disabled: true,
              options: [],
              placeholder: 'Please connect your account first',
            };
          }
          const { apiKey, baseUrl } = auth.props;
          const client = new ContextualAI({
            apiKey: apiKey,
            baseURL: baseUrl || 'https://api.contextual.ai/v1',
          });

          const allDatastores: Datastore[] = [];
          for await (const datastore of client.datastores.list()) {
            allDatastores.push(datastore);
          }

          return {
            options: allDatastores.map((datastore: Datastore) => ({
              label: datastore.name,
              value: datastore.id,
            })),
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to fetch datastores. Please check your API key.',
          };
        }
      },
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      description: 'Optional system prompt for the agent',
      required: false,
    }),
    filterPrompt: Property.LongText({
      displayName: 'Filter Prompt',
      description: 'Optional prompt for filtering retrieved chunks',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, baseUrl } = auth.props;
    const { name, description, datastoreIds, systemPrompt, filterPrompt } = propsValue;

    const client = new ContextualAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.contextual.ai/v1',
    });

    const datastoreIdsArray = datastoreIds || [];

    const agentParams: any = {
      name,
    };

    if (description) agentParams.description = description;
    if (datastoreIdsArray.length > 0) agentParams.datastore_ids = datastoreIdsArray;
    if (systemPrompt) agentParams.multiturn_system_prompt = systemPrompt;
    if (filterPrompt) agentParams.filter_prompt = filterPrompt;

    const response = await client.agents.create(agentParams);

    return {
      agent_id: response.id,
      datastore_ids: response.datastore_ids,
      status: 'Agent created successfully',
    };
  },
});
