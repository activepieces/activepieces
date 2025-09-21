import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall } from '../common';

export const addNoteToEntityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'add_note_to_entity',
  displayName: 'Add Note to Entity',
  description: 'Adds a note to a contact, opportunity, or project in Capsule CRM.',
  props: {
    entityType: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'Type of entity to add note to',
      required: true,
      options: {
        options: [
          { label: 'Contact (Party)', value: 'party' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Project (Case)', value: 'kase' },
        ],
      },
    }),
    entityId: Property.Number({
      displayName: 'Entity ID',
      description: 'ID of the entity to add note to',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Note Content',
      description: 'Content of the note',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Note Type',
      description: 'Type of note',
      required: false,
      defaultValue: 'note',
      options: {
        options: [
          { label: 'Note', value: 'note' },
          { label: 'Email', value: 'email' },
          { label: 'Call', value: 'call' },
          { label: 'Meeting', value: 'meeting' },
        ],
      },
    }),
  },
  async run(context) {
    const { entityType, entityId, content, type } = context.propsValue;

    // Build the entry (note) object
    const entry: any = {
      content: content,
      type: type || 'note',
    };

    // Add the association to the appropriate entity
    entry[entityType] = { id: entityId };

    const requestBody = { entry };

    const response = await makeApiCall(
      context.auth,
      '/entries',
      'POST',
      requestBody
    );

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    } else {
      throw new Error(`Failed to add note: ${response.status} ${response.body?.message || ''}`);
    }
  },
});