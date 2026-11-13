import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkOutputSchemas } from '../../output-schemas';

export const updateNote = createAction({
  auth: folkAuth,
  name: 'update_note',
  displayName: 'Update Note',
  description: 'Change the text or visibility of a Folk note.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.note,
  aiMetadata: {
    description:
      'Updates a Folk note by ID: new Markdown content (replaces the whole text) and/or visibility (public or private). Omitted fields stay as they are. Returns the updated note.',
    idempotent: false,
  },
  props: {
    noteId: folkAi.idProp({ displayName: 'Note ID', description: 'ID of the note to update.' }),
    content: Property.LongText({ displayName: 'Content', description: 'New note text (replaces the old text).', required: false }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'public or private. Leave empty to keep the current visibility.',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const content = folkFields.textValue({ value: p.content });
    const visibility = p.visibility === 'public' || p.visibility === 'private' ? p.visibility : undefined;
    if (content === undefined && visibility === undefined) {
      throw new Error('Nothing to update. Give new Content or a Visibility.');
    }
    return folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/v1/notes/${folkClient.idSegment({ value: p.noteId, label: 'Note ID' })}`,
      body: { ...(content !== undefined ? { content } : {}), ...(visibility ? { visibility } : {}) },
    });
  },
});
