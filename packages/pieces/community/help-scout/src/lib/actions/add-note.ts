import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Thread } from '../common/types';

export const addNote = createAction({
  auth: helpScoutAuth,
  name: 'add-note',
  displayName: 'Add Note',
  description: 'Adds an internal note to a conversation',
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'ID of the conversation to add note to',
      required: true,
    }),
    noteBody: Property.LongText({
      displayName: 'Note Body',
      description: 'Content of the internal note',
      required: true,
    }),
    user: helpScoutCommon.userDropdown,
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'File attachments (provide file URLs or base64 encoded data)',
      required: false,
    }),
    imported: Property.Checkbox({
      displayName: 'Imported',
      description: 'Mark as imported note',
      required: false,
      defaultValue: false,
    }),
    createdAt: Property.DateTime({
      displayName: 'Created At',
      description: 'When the note was created (for imported notes)',
      required: false,
    }),
  },
  async run(context) {
    const {
      conversationId,
      noteBody,
      user,
      attachments,
      imported,
      createdAt,
    } = context.propsValue;

    // Prepare note data
    const noteData: any = {
      type: 'note',
      text: noteBody,
      imported: imported || false,
    };

    // Add optional fields
    if (user) {
      noteData.user = parseInt(user);
    }

    if (attachments && attachments.length > 0) {
      noteData.attachments = attachments;
    }

    if (createdAt) {
      noteData.createdAt = createdAt;
    }

    try {
      const note = await helpScoutCommon.makeRequest(
        context.auth,
        HttpMethod.POST,
        `/conversations/${conversationId}/threads`,
        noteData
      );

      return {
        success: true,
        note,
      };
    } catch (error) {
      throw new Error(`Failed to add note: ${error}`);
    }
  },
});