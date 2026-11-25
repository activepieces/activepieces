import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { entryOutputSchema } from '../../common/output-schemas';
import { CreateEntryParams } from '../../common/types';

export const aiAddNote = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_add_note',
  classification: 'WRITE',
  displayName: 'Add Note',
  description: 'Adds a note to a contact, opportunity or project.',
  audience: 'ai',
  aiMetadata: {
    description: 'Adds a note to the history of exactly one Capsule CRM record: give one of Party ID, Opportunity ID or Project ID. Returns the created entry with its id. Not idempotent: each call adds another note.',
    idempotent: false,
  },
  outputSchema: entryOutputSchema,
  props: {
    content: Property.LongText({ displayName: 'Content', description: 'Text of the note.', required: true }),
    party_id: Property.ShortText({ displayName: 'Party ID', description: 'Numeric ID of a person or organisation to link.', required: false }),
    opportunity_id: Property.ShortText({ displayName: 'Opportunity ID', description: 'Numeric ID of an opportunity to link.', required: false }),
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'Numeric ID of a project to link.', required: false }),
  },
  async run({ auth, propsValue }) {
    const content = capsuleCrmClient.requiredText({ value: propsValue.content, label: 'Content' });
    const link = capsuleCrmClient.exactlyOneLink({ partyId: propsValue.party_id, opportunityId: propsValue.opportunity_id, projectId: propsValue.project_id, required: true });
    const params: CreateEntryParams = { type: 'note', content };
    if (link) params[link.key] = { id: link.id };
    return capsuleCrmClient.createEntry({ auth, params });
  },
});
