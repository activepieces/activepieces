import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';
import { GmailRequests } from '../common/data';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  description:
    'Archives an email message by removing it from the inbox (moves to "All Mail").',
  displayName: 'Archive Email',
  props: {
    message_id: GmailProps.message,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    let originalMessage = null;
    let wasInInbox = false;

    try {
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: context.propsValue.message_id,
        format: 'minimal',
      });
      originalMessage = messageResponse.data;
      wasInInbox = (originalMessage.labelIds || []).includes('INBOX');

      if (!wasInInbox) {
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
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          removeLabelIds: ['INBOX'],
        },
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
        throw new Error(
          'Insufficient permissions to modify message labels. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      } else if (error.code === 500) {
        throw new Error('Gmail API server error. Please try again later.');
      }

      throw new Error(`Failed to archive message: ${error.message}`);
    }
  },
});
