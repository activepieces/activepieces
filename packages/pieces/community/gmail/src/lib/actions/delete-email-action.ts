import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  description: 'Moves an email message to Trash.',
  displayName: 'Delete Email',
  props: {
    message_id: GmailProps.message,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    let originalMessage = null;
    let wasInTrash = false;

    try {
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: context.propsValue.message_id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'To', 'Date'],
      });
      originalMessage = messageResponse.data;
      wasInTrash = (originalMessage.labelIds || []).includes('TRASH');

      if (wasInTrash) {
        return {
          id: context.propsValue.message_id,
          threadId: originalMessage.threadId,
          labelIds: originalMessage.labelIds || [],
        };
      }
    } catch (error) {
      throw new Error(
        `Message with ID ${context.propsValue.message_id} not found or inaccessible`
      );
    }

    try {
      // Move to trash - can be restored
      const response = await gmail.users.messages.trash({
        userId: 'me',
        id: context.propsValue.message_id,
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `Message with ID ${context.propsValue.message_id} not found`
        );
      } else if (error.code === 400) {
        if (error.message?.includes('Invalid message')) {
          throw new Error(
            'Invalid message ID format or message no longer exists'
          );
        }
        throw new Error(`Invalid request: ${error.message}`);
      } else if (error.code === 403) {
        const requiredScope = 'https://www.googleapis.com/auth/gmail.modify';
        throw new Error(
          `Insufficient permissions to delete messages. Ensure the ${requiredScope} scope is granted.`
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      } else if (error.code === 500) {
        throw new Error('Gmail API server error. Please try again later.');
      }

      const operation = 'move to trash';
      throw new Error(`Failed to ${operation} message: ${error.message}`);
    }
  },
});
