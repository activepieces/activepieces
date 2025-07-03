import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { parseStream, convertAttachment } from '../common/data';

async function enrichGmailMessage({
  gmail,
  messageId,
  files,
  labelInfo,
}: {
  gmail: any;
  messageId: string;
  files: FilesService;
  labelInfo: {
    labelId: string;
    labelName: string;
  };
}) {
  const rawMailResponse = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'raw',
  });

  const threadResponse = await gmail.users.threads.get({
    userId: 'me',
    id: rawMailResponse.data.threadId!,
  });

  const parsedMailResponse = await parseStream(
    Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
  );

  return {
    message: {
      ...parsedMailResponse,
      attachments: await convertAttachment(
        parsedMailResponse.attachments,
        files
      ),
    },
    thread: threadResponse.data,
    labelInfo: {
      ...labelInfo,
      addedAt: Date.now(),
    },
  };
}

export const gmailNewLabeledEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_labeled_email',
  displayName: 'New Labeled Email',
  description: 'Triggers when a label is added to an email',
  props: {
    label: {
      ...GmailProps.label,
      required: true,
    },
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const profile = await gmail.users.getProfile({
      userId: 'me',
    });

    await context.store.put('lastHistoryId', profile.data.historyId);
  },
  onDisable: async (context) => {
    await context.store.delete('lastHistoryId');
  },
  run: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const lastHistoryId = await context.store.get('lastHistoryId');

    const historyResponse = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: lastHistoryId as string,
      labelId: context.propsValue.label.id,
      historyTypes: ['labelAdded', 'messageAdded'],
    });

    const labeledMessages = new Map<string, string>();
    const results = [];

    if (historyResponse.data.history) {
      for (const history of historyResponse.data.history) {
        if (history.labelsAdded) {
          for (const labelAdded of history.labelsAdded) {
            if (
              labelAdded.labelIds?.includes(context.propsValue.label.id) &&
              labelAdded.message?.id
            ) {
              labeledMessages.set(
                labelAdded.message.id,
                history.id?.toString() || ''
              );
            }
          }
        } else if (history.messagesAdded) {
          for (const messageAdded of history.messagesAdded) {
            if (
              messageAdded.message?.id &&
              messageAdded.message.labelIds?.includes(
                context.propsValue.label.id
              )
            ) {
              labeledMessages.set(
                messageAdded.message.id,
                history.id?.toString() || ''
              );
            }
          }
        }
      }
    }

    for (const [messageId, historyId] of labeledMessages) {
      const enrichedMessage = await enrichGmailMessage({
        gmail,
        messageId,
        files: context.files,
        labelInfo: {
          labelId: context.propsValue.label.id,
          labelName: context.propsValue.label.name,
        },
      });

      if (lastHistoryId !== historyId) {
        results.push({
          id: historyId,
          data: enrichedMessage,
        });
      }
    }

    if (historyResponse.data.historyId) {
      await context.store.put('lastHistoryId', historyResponse.data.historyId);
    }

    return results;
  },
  test: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [context.propsValue.label.id],
      maxResults: 5,
    });

    const results = [];

    if (messagesResponse.data.messages) {
      for (const message of messagesResponse.data.messages) {
        const messageId = message.id;
        if (!messageId) {
          continue;
        }
        const enrichedMessage = await enrichGmailMessage({
          gmail,
          messageId: messageId,
          files: context.files,
          labelInfo: {
            labelId: context.propsValue.label.id,
            labelName: context.propsValue.label.name,
          },
        });

        results.push({
          id: messageId,
          data: enrichedMessage,
        });
      }
    }

    return results;
  },
});
