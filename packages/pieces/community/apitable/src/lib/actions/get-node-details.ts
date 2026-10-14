import { Property, createAction } from '@activepieces/pieces-framework';
import { APITableCommon, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { getNodeDetailsActionOutputSchema } from '../output-schemas';

export const getNodeDetailsAction = createAction({
  auth: APITableAuth,
  name: 'apitable_get_node_details',
  classification: 'READ',
  displayName: 'Get Node Details',
  description: 'Reads the details of a single file node, including its children.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads a single AITable node (datasheet, folder, form, dashboard, etc.) by ID, returning its name, type, and, for a folder, the child nodes inside it. Use to confirm a node\'s type or list a folder\'s contents; obtain the node ID from Search Nodes or List Datasheets. Idempotent: it only reads data.',
    idempotent: true,
  },
  props: {
    space_id: APITableCommon.space_id,
    node_id: Property.ShortText({
      displayName: 'Node ID',
      description: 'The ID of the node to read.',
      required: true,
    }),
  },
  outputSchema: getNodeDetailsActionOutputSchema,
  async run(context) {
    const client = makeClient(context.auth.props);
    const response = await client.getNodeDetails(
      context.propsValue.space_id as string,
      context.propsValue.node_id
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }

    return response;
  },
});
