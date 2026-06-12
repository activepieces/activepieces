import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sliteAuth } from '../auth';
import { sliteApi } from '../common/client';
import { sliteProps } from '../common/props';
import { SliteNote } from '../common/types';

export const sliteCreateDocAction = createAction({
  auth: sliteAuth,
  name: 'create_doc',
  displayName: 'Create Doc',
  description: 'Creates a doc inside a parent doc or your private channel.',
  audience: 'both',
  aiMetadata: {
    description:
      "Creates a new Slite doc with the given title and optional body, placed under a parent doc id or, if no parent is given, in the caller's private channel. Content may be supplied as Markdown or HTML, and a template can be applied by id. Not idempotent: each call creates a separate doc even with identical input.",
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new doc.',
      required: true,
    }),
    parent_note_id: sliteProps.noteId({
      required: false,
      displayName: 'Parent Doc',
      description:
        'Where to create the new doc. Leave blank to create it in your private channel.',
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The body of the doc.',
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
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Apply a template to the new doc by its ID.',
      required: false,
    }),
    attributes: Property.Array({
      displayName: 'Attributes',
      description:
        "Attributes for the parent collection, ordered by column. Ignored if they don't match the column type.",
      required: false,
    }),
  },
  async run(context) {
    const { title, parent_note_id, content, content_format, template_id, attributes } =
      context.propsValue;
    const note = await sliteApi.call<SliteNote>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/notes',
      body: {
        title,
        parentNoteId: parent_note_id,
        templateId: template_id,
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
