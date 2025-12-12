import { createAction, Property } from "@activepieces/pieces-framework";
import { contextualAiAuth } from "../../index";
import { ContextualAI } from 'contextual-client';

export const createDatastoreAction = createAction({
  auth: contextualAiAuth,
  name: 'create_datastore',
  displayName: 'Create Datastore',
  description: 'Create a new datastore for organizing documents',
  props: {
    name: Property.ShortText({
      displayName: 'Datastore Name',
      description: 'Name for the new datastore',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, baseUrl } = auth.props;
    const { name } = propsValue;

    const client = new ContextualAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.contextual.ai/v1',
    });

    const response = await client.datastores.create({
      name,
    });

    return {
      datastore_id: response.id,
      status: 'Datastore created successfully',
    };
  },
});
