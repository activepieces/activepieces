import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../../index';
import { makeRequest } from '../common';

export const createNoteAction = createAction({
  auth: memAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Log a plain-text Markdown note into Mem, optionally with formatting, templates, collections, and timestamps.',
  props: {
    content: Property.LongText({
      displayName: 'Content',
      required: true,
      description: 'Markdown-formatted content. First line is treated as the note title.',
    }),
    id: Property.ShortText({
      displayName: 'Note ID',
      required: false,
      description: 'Optional UUID to assign to the note.',
    }),
    add_to_collections: Property.Array({
      displayName: 'Add to Collections',
      required: false,
      description: 'Collection titles or IDs to assign this note to. New collections will be created if they don’t exist.',
    }),
  },
  async run(context) {
    const {
      content,
      id,
      add_to_collections,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const body: Record<string, unknown> = {
      content,
      ...(id ? { id } : {}),
      ...(add_to_collections ? { add_to_collections } : {}),
    };

    const result = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/notes',
      body
    );

    return result;
  },
});
