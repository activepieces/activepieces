import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';
import { ninjapipeFields } from '../../common/fields';

export const aiAddContactNote = createAction({
  auth: ninjapipeAuth,
  name: 'ai_add_contact_note',
  classification: 'WRITE',
  displayName: 'Add Note to Contact',
  description: "Adds a note to a contact's timeline.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Add a note (title plus optional content text) to a NinjaPipe contact's activity timeline by contact_id. Not idempotent: each call adds another note.",
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.activity,
  props: {
    contact_id: ninjapipeAiProps.id({ displayName: 'Contact ID', description: 'Contact UUID from ai_search_contacts.' }),
    title: ninjapipeAiProps.text({ displayName: 'Title', description: 'Short note title.', required: true }),
    content: ninjapipeAiProps.text({ displayName: 'Content', description: 'Note text.' }),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: `/contacts/${ninjapipeClient.pathId({ value: p.contact_id, field: 'Contact ID' })}/activities`,
      body: ninjapipeFields.compact({ type: 'note', title: p.title, content: p.content }),
      operation: 'add contact note',
    });
  },
});
