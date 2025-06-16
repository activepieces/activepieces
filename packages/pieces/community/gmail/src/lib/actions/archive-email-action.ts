import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailRequests } from '../common/data';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  description: 'Archive an email message by removing it from the inbox (moves to "All Mail")',
  displayName: 'Archive Email',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to archive',
      required: true,
    }),
    verify_message_exists: Property.Checkbox({
      displayName: 'Verify Message Exists',
      description: 'Check if the message exists and is in the inbox before archiving',
      required: true,
      defaultValue: true,
    }),
    force_archive: Property.Checkbox({
      displayName: 'Force Archive',
      description: 'Archive the message even if it is not currently in the inbox',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    let originalMessage = null;
    let wasInInbox = false;

    if (context.propsValue.verify_message_exists) {
      try {
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: context.propsValue.message_id,
          format: 'minimal',
        });
        originalMessage = messageResponse.data;
        wasInInbox = (originalMessage.labelIds || []).includes('INBOX');

        if (!wasInInbox && !context.propsValue.force_archive) {
          return {
            success: true,
            message: {
              id: context.propsValue.message_id,
              threadId: originalMessage.threadId,
              snippet: originalMessage.snippet || '',
            },
            operation: {
              type: 'archive',
              status: 'already_archived',
              timestamp: new Date().toISOString(),
              wasInInbox: false,
            },
            note: 'Message was already archived (not in inbox)',
          };
        }
      } catch (error) {
        throw new Error(`Message with ID ${context.propsValue.message_id} not found or inaccessible`);
      }
    }

    try {
      const modifyResponse = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          removeLabelIds: ['INBOX'],
        },
      });

      const updatedMessage = await gmail.users.messages.get({
        userId: 'me',
        id: context.propsValue.message_id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'To', 'Date'],
      });

      const headers = updatedMessage.data.payload?.headers || [];
      const headerMap = headers.reduce((acc: { [key: string]: string }, header) => {
        if (header.name && header.value) {
          acc[header.name.toLowerCase()] = header.value;
        }
        return acc;
      }, {});

      const allLabelsResponse = await GmailRequests.getLabels(context.auth);
      const labelMap = allLabelsResponse.body.labels.reduce((acc: { [key: string]: string }, label) => {
        acc[label.id] = label.name;
        return acc;
      }, {});

      const currentLabelNames = (updatedMessage.data.labelIds || []).map(id => labelMap[id] || id);
      const isNowArchived = !(updatedMessage.data.labelIds || []).includes('INBOX');

      return {
        success: true,
        message: {
          id: context.propsValue.message_id,
          threadId: updatedMessage.data.threadId,
          subject: headerMap['subject'] || '',
          from: headerMap['from'] || '',
          to: headerMap['to'] || '',
          date: headerMap['date'] || '',
          snippet: updatedMessage.data.snippet || '',
        },
        operation: {
          type: 'archive',
          status: isNowArchived ? 'archived' : 'failed',
          timestamp: new Date().toISOString(),
          wasInInbox: wasInInbox,
          isNowArchived: isNowArchived,
          messageVerified: context.propsValue.verify_message_exists,
          forceArchive: context.propsValue.force_archive,
        },
        labels: {
          removed: {
            ids: ['INBOX'],
            names: ['INBOX'],
            count: wasInInbox ? 1 : 0,
          },
          current: {
            ids: updatedMessage.data.labelIds || [],
            names: currentLabelNames,
            count: (updatedMessage.data.labelIds || []).length,
          },
        },
        originalMessage: originalMessage ? {
          labelIds: originalMessage.labelIds || [],
          snippet: originalMessage.snippet || '',
          wasInInbox: wasInInbox,
        } : null,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`Message with ID ${context.propsValue.message_id} not found`);
      } else if (error.code === 400) {
        if (error.message?.includes('Invalid message')) {
          throw new Error('Invalid message ID format or message no longer exists');
        }
        throw new Error(`Invalid request: ${error.message}`);
      } else if (error.code === 403) {
        throw new Error('Insufficient permissions to modify message labels. Ensure the gmail.modify scope is granted.');
      } else if (error.code === 429) {
        throw new Error('Gmail API rate limit exceeded. Please try again later.');
      } else if (error.code === 500) {
        throw new Error('Gmail API server error. Please try again later.');
      }
      
      throw new Error(`Failed to archive message: ${error.message}`);
    }
  },
}); 