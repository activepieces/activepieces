import { createAction } from '@activepieces/pieces-framework';
import { sliteAuth } from '../auth';
import { sliteApi } from '../common/client';
import { sliteProps } from '../common/props';

export const sliteFetchSubDocsAction = createAction({
  auth: sliteAuth,
  name: 'fetch_sub_docs',
  displayName: 'Fetch Sub Docs',
  description: 'Returns the list of sub docs nested under a parent doc.',
  props: {
    note_id: sliteProps.noteId({
      required: true,
      displayName: 'Parent Doc',
      description: 'The doc whose sub docs you want to list.',
    }),
  },
  async run(context) {
    const { note_id } = context.propsValue;
    if (!note_id) {
      return { notes: [], total: 0 };
    }
    const notes = await sliteApi.getAllChildren({
      apiKey: context.auth.secret_text,
      noteId: note_id,
    });
    return {
      notes,
      total: notes.length,
    };
  },
});
