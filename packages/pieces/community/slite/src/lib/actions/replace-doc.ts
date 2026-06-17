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
  audience: 'both',
  aiMetadata: {
    description:
      'Overwrites an existing Slite doc identified by its note id, replacing the whole body (Markdown or HTML) and/or the title; omitted fields are left untouched. Use this for a full-content rewrite rather than a targeted block edit (see Update Doc for that). Idempotent: applying the same input to the same doc id leaves it in the same final state.',
    idempotent: true,
  },
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
