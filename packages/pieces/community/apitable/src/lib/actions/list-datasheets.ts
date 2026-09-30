import { createAction } from '@activepieces/pieces-framework';
import { APITableCommon, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { listDatasheetsActionOutputSchema } from '../output-schemas';

export const listDatasheetsAction = createAction({
  auth: APITableAuth,
  name: 'apitable_list_datasheets',
  classification: 'SEARCH',
  displayName: 'List Datasheets',
  description: 'Lists the datasheets available in a space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the datasheets in an AITable space, returning each datasheet\'s ID and name. Use to discover a datasheet ID before creating, finding, updating, or deleting its records. Idempotent: it only reads data.',
    idempotent: true,
  },
  props: {
    space_id: APITableCommon.space_id,
  },
  outputSchema: listDatasheetsActionOutputSchema,
  async run(context) {
    const client = makeClient(context.auth.props);
    const response = await client.listDatasheets(
      context.propsValue.space_id as string
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }

    return response;
  },
});
