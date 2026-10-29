import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkOutputSchemas } from '../../output-schemas';

export const createNote = createAction({
  auth: folkAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Add a note to a Folk person, company or object.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.note,
  aiMetadata: {
    description:
      'Adds a Markdown note to a Folk person (per_...), company (com_...) or object such as a deal (obj_...). Visibility is public (whole workspace, default) or private (only the API key owner). Give Parent Note ID to post a reply. Each call adds a new note; pass an Idempotency Key to make a retry return the first note instead. Returns the note with its ID.',
    idempotent: false,
  },
  props: {
    entityId: folkAi.idProp({ displayName: 'Record ID', description: 'ID of the person, company or object the note belongs to.' }),
    content: Property.LongText({ displayName: 'Content', description: 'Note text; Markdown is supported.', required: true }),
    visibility: visibilityProp(),
    parentNoteId: folkAi.idProp({ displayName: 'Parent Note ID', description: 'Optional note ID to reply to.', required: false }),
    idempotencyKey: folkAi.idempotencyKeyProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const content = folkFields.textValue({ value: p.content });
    if (content === undefined) {
      throw new Error('Content is required.');
    }
    const parent = folkFields.textValue({ value: p.parentNoteId });
    return folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/notes',
      body: {
        entity: { id: entityId({ value: p.entityId }) },
        content,
        visibility: p.visibility === 'private' ? 'private' : 'public',
        ...(parent ? { parentNote: { id: folkClient.idSegment({ value: parent, label: 'Parent Note ID' }) } } : {}),
      },
      idempotencyKey: folkFields.idempotencyKeyValue({ value: p.idempotencyKey }),
    });
  },
});

function visibilityProp() {
  return Property.StaticDropdown({
    displayName: 'Visibility',
    description: 'public: the whole workspace sees it (default). private: only the API key owner.',
    required: false,
    options: {
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Private', value: 'private' },
      ],
    },
  });
}

function entityId({ value }: { value: unknown }): string {
  const id = folkClient.idSegment({ value, label: 'Record ID' });
  if (!/^(per|com|obj)_/.test(id)) {
    throw new Error('Record ID must be a person (per_...), company (com_...) or object (obj_...) ID.');
  }
  return id;
}
