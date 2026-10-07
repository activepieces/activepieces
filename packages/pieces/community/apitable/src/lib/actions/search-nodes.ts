import { Property, createAction } from '@activepieces/pieces-framework';
import { APITableCommon, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { searchNodesActionOutputSchema } from '../output-schemas';

export const searchNodesAction = createAction({
  auth: APITableAuth,
  name: 'apitable_search_nodes',
  classification: 'SEARCH',
  displayName: 'Search Nodes',
  description:
    'Searches the file nodes (datasheets, folders, forms, dashboards, etc.) in a space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches every file node in an AITable space by type and/or name query, regardless of folder hierarchy; returns id, name, type and parent for each match. Use to find folders, forms, dashboards, or mirrors that List Datasheets does not surface since it only returns datasheets. Idempotent: it only reads data.',
    idempotent: true,
  },
  props: {
    space_id: APITableCommon.space_id,
    type: Property.StaticDropdown({
      displayName: 'Node Type',
      description: 'The type of node to search for.',
      required: true,
      options: {
        options: [
          { label: 'Datasheet', value: 'Datasheet' },
          { label: 'Folder', value: 'Folder' },
          { label: 'Form', value: 'Form' },
          { label: 'Dashboard', value: 'Dashboard' },
          { label: 'Mirror', value: 'Mirror' },
        ],
      },
    }),
    query: Property.ShortText({
      displayName: 'Name Query',
      description: 'Filter results to node names containing this text.',
      required: false,
    }),
  },
  outputSchema: searchNodesActionOutputSchema,
  async run(context) {
    const client = makeClient(context.auth.props);
    const response = await client.searchNodes(
      context.propsValue.space_id as string,
      {
        type: context.propsValue.type,
        query: context.propsValue.query,
      }
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }

    return response;
  },
});
