import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { memAuth } from '../../index';

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
    auto_organize: Property.ShortText({
      displayName: 'Auto Organize',
      required: false,
      description: 'Set to true or provide custom organization instructions.',
    }),
    apply_template: Property.ShortText({
      displayName: 'Apply Template',
      required: false,
      description: 'Template title or ID to apply to the note.',
    }),
    auto_format: Property.ShortText({
      displayName: 'Auto Format',
      required: false,
      description: 'Set to true or provide custom formatting instructions.',
    }),
    created_at: Property.ShortText({
      displayName: 'Created At',
      required: false,
      description: 'ISO 8601 datetime string (e.g., 2025-04-01T14:30:45Z). Defaults to now.',
    }),
    updated_at: Property.ShortText({
      displayName: 'Updated At',
      required: false,
      description: 'ISO 8601 datetime string. Defaults to created_at.',
    }),
  },
  async run(context) {
    const {
      content,
      id,
      add_to_collections,
      auto_organize,
      apply_template,
      auto_format,
      created_at,
      updated_at,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const body: Record<string, unknown> = {
      content,
      ...(id ? { id } : {}),
      ...(add_to_collections ? { add_to_collections } : {}),
      ...(auto_organize ? {
        auto_organize: auto_organize === 'true' ? true : auto_organize
      } : {}),
      ...(apply_template ? { apply_template } : {}),
      ...(auto_format ? {
        auto_format: auto_format === 'true' ? true : auto_format
      } : {}),
      ...(created_at ? { created_at } : {}),
      ...(updated_at ? { updated_at } : {}),
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
