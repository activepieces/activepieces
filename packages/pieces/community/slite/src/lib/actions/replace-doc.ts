import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sliteAuth } from '../auth';
import { sliteApi } from '../common/client';
import { sliteProps } from '../common/props';
import { SliteNote } from '../common/types';

export const sliteReplaceDocAction = createAction({
  auth: sliteAuth,
  name: 'replace_doc',
  displayName: 'Replace Doc',
  description:
    'Replaces the entire content and/or title of a doc. Fields you leave blank are kept unchanged.',
  props: {
    note_id: sliteProps.noteId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'A new title for the doc.',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'New content that replaces the entire doc body.',
      required: false,
    }),
    content_format: Property.StaticDropdown({
      displayName: 'Content Format',
      description: 'How the content above is written.',
      required: false,
      defaultValue: 'markdown',
      options: {
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
    attributes: Property.Array({
      displayName: 'Attributes',
      description: 'Attributes for the parent collection, ordered by column.',
      required: false,
    }),
  },
  async run(context) {
    const { note_id, title, content, content_format, attributes } =
      context.propsValue;
    const note = await sliteApi.call<SliteNote>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      resourceUri: `/notes/${note_id}`,
      body: {
        title,
        attributes,
        ...(content
          ? content_format === 'html'
            ? { html: content }
            : { markdown: content }
          : {}),
      },
    });
    return note;
  },
});
