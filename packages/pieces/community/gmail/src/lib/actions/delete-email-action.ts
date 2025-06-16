import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';
import { GmailRequests } from '../common/data';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  description: 'Move an email message to Trash (can be restored from Trash)',
  displayName: 'Delete Email',
  props: {
    message_id: GmailProps.message,
    verify_message_exists: Property.Checkbox({
      displayName: 'Verify Message Exists',
      description: 'Check if the message exists before attempting to delete it',
      required: true,
      defaultValue: true,
    }),
    force_delete: Property.Checkbox({
      displayName: 'Force Delete',
      description: 'Delete the message even if it is already in trash',
      required: false,
      defaultValue: false,
    }),
    permanent_delete: Property.Checkbox({
      displayName: 'Permanent Delete',
      description: 'WARNING: Permanently delete the message (cannot be undone). If false, message is moved to Trash.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    let originalMessage = null;
    let wasInTrash = false;

    if (context.propsValue.verify_message_exists) {
      try {
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: context.propsValue.message_id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'To', 'Date'],
        });
        originalMessage = messageResponse.data;
        wasInTrash = (originalMessage.labelIds || []).includes('TRASH');

        if (wasInTrash && !context.propsValue.force_delete && !context.propsValue.permanent_delete) {
          return {
            success: true,
            message: {
              id: context.propsValue.message_id,
              threadId: originalMessage.threadId,
              snippet: originalMessage.snippet || '',
            },
            operation: {
              type: 'delete',
              method: 'trash',
              status: 'already_in_trash',
              timestamp: new Date().toISOString(),
              wasInTrash: true,
              permanent: false,
            },
            note: 'Message was already in trash',
          };
        }
      } catch (error) {
        throw new Error(`Message with ID ${context.propsValue.message_id} not found or inaccessible`);
      }
    }

    try {
      let deleteResponse;
      let operationMethod;
      let isPermanent = false;

      if (context.propsValue.permanent_delete) {
        // Permanent deletion - cannot be undone
        deleteResponse = await gmail.users.messages.delete({
          userId: 'me',
          id: context.propsValue.message_id,
        });
        operationMethod = 'permanent_delete';
        isPermanent = true;
      } else {
        // Move to trash - can be restored
        deleteResponse = await gmail.users.messages.trash({
          userId: 'me',
          id: context.propsValue.message_id,
        });
        operationMethod = 'trash';
        isPermanent = false;
      }

      if (isPermanent) {
        const headers = originalMessage?.payload?.headers || [];
        const headerMap = headers.reduce((acc: { [key: string]: string }, header) => {
          if (header.name && header.value) {
            acc[header.name.toLowerCase()] = header.value;
          }
          return acc;
        }, {});

        return {
          success: true,
          message: {
            id: context.propsValue.message_id,
            threadId: originalMessage?.threadId || '',
            subject: headerMap['subject'] || '',
            from: headerMap['from'] || '',
            to: headerMap['to'] || '',
            date: headerMap['date'] || '',
            snippet: originalMessage?.snippet || '',
          },
          operation: {
            type: 'delete',
            method: operationMethod,
            status: 'permanently_deleted',
            timestamp: new Date().toISOString(),
            wasInTrash: wasInTrash,
            permanent: true,
            messageVerified: context.propsValue.verify_message_exists,
            forceDelete: context.propsValue.force_delete,
          },
          warning: 'Message has been permanently deleted and cannot be recovered',
          originalMessage: originalMessage ? {
            labelIds: originalMessage.labelIds || [],
            snippet: originalMessage.snippet || '',
            wasInTrash: wasInTrash,
          } : null,
        };
      } else {
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
        const isNowInTrash = (updatedMessage.data.labelIds || []).includes('TRASH');

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
            type: 'delete',
            method: operationMethod,
            status: isNowInTrash ? 'moved_to_trash' : 'failed',
            timestamp: new Date().toISOString(),
            wasInTrash: wasInTrash,
            isNowInTrash: isNowInTrash,
            permanent: false,
            messageVerified: context.propsValue.verify_message_exists,
            forceDelete: context.propsValue.force_delete,
          },
          labels: {
            added: {
              ids: isNowInTrash && !wasInTrash ? ['TRASH'] : [],
              names: isNowInTrash && !wasInTrash ? ['TRASH'] : [],
              count: isNowInTrash && !wasInTrash ? 1 : 0,
            },
            current: {
              ids: updatedMessage.data.labelIds || [],
              names: currentLabelNames,
              count: (updatedMessage.data.labelIds || []).length,
            },
          },
          note: 'Message moved to Trash and can be restored if needed',
          originalMessage: originalMessage ? {
            labelIds: originalMessage.labelIds || [],
            snippet: originalMessage.snippet || '',
            wasInTrash: wasInTrash,
          } : null,
        };
      }
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`Message with ID ${context.propsValue.message_id} not found`);
      } else if (error.code === 400) {
        if (error.message?.includes('Invalid message')) {
          throw new Error('Invalid message ID format or message no longer exists');
        }
        throw new Error(`Invalid request: ${error.message}`);
      } else if (error.code === 403) {
        const requiredScope = context.propsValue.permanent_delete ? 'https://mail.google.com/' : 'gmail.modify';
        throw new Error(`Insufficient permissions to delete messages. Ensure the ${requiredScope} scope is granted.`);
      } else if (error.code === 429) {
        throw new Error('Gmail API rate limit exceeded. Please try again later.');
      } else if (error.code === 500) {
        throw new Error('Gmail API server error. Please try again later.');
      }
      
      const operation = context.propsValue.permanent_delete ? 'permanently delete' : 'move to trash';
      throw new Error(`Failed to ${operation} message: ${error.message}`);
    }
  },
}); 