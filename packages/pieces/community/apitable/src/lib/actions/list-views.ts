import { createAction } from '@activepieces/pieces-framework';
import { APITableCommon, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { listViewsActionOutputSchema } from '../output-schemas';

export const listViewsAction = createAction({
  auth: APITableAuth,
  name: 'apitable_list_views',
  classification: 'SEARCH',
  displayName: 'List Views',
  description: 'Lists the views of a datasheet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the views (Grid, Kanban, Gallery, etc.) of an AITable datasheet, returning each view\'s ID, name, and type. Use to discover a view ID to scope Find Records to that view\'s rows and sort order. Idempotent: it only reads data.',
    idempotent: true,
  },
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
  },
  outputSchema: listViewsActionOutputSchema,
  async run(context) {
    const client = makeClient(context.auth.props);
    const response = await client.listViews(
      context.propsValue.datasheet_id as string
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }

    return response;
  },
});
