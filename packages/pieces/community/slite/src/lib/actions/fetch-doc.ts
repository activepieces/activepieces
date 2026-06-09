import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sliteAuth } from '../auth';
import { sliteApi } from '../common/client';
import { sliteProps } from '../common/props';
import { SliteNote } from '../common/types';

export const sliteFetchDocAction = createAction({
  auth: sliteAuth,
  name: 'fetch_doc',
  displayName: 'Fetch Doc',
  description: 'Returns a readable doc by its ID.',
  props: {
    note_id: sliteProps.noteId({ required: true }),
    format: Property.StaticDropdown({
      displayName: 'Content Format',
      description: 'The format to return the doc content in.',
      required: false,
      defaultValue: 'md',
      options: {
        options: [
          { label: 'Markdown', value: 'md' },
          { label: 'HTML', value: 'html' },
          { label: 'SliteML', value: 'sliteml' },
        ],
      },
    }),
  },
  async run(context) {
    const { note_id, format } = context.propsValue;
    const note = await sliteApi.call<SliteNote>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/notes/${note_id}`,
      query: { format },
    });
    return note;
  },
});
