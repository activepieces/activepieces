import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const createNoteAction = createAction({
  name: 'create_note',
  displayName: 'Create Note',
  description: "Adds a note to a lead's timeline.",
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Note content',
      required: true,
    }),
    noteType: Property.StaticDropdown({
      displayName: 'Note Type',
      description: 'Type of note',
      required: false,
      defaultValue: 'general',
      options: {
        disabled: false,
        options: [
          { label: 'General', value: 'general' },
          { label: 'Meeting', value: 'meeting' },
          { label: 'Call', value: 'call' },
          { label: 'Follow-up', value: 'followup' },
          { label: 'Internal', value: 'internal' },
        ],
      },
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('communications/create-note', {
      leadId: context.propsValue.leadId,
      content: context.propsValue.content,
      noteType: context.propsValue.noteType,
    });
  },
});
