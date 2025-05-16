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

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [context.propsValue.label.id],
      maxResults: 1,
    });

    await context.store.put('lastMessageId', messagesResponse.data.messages?.[0]?.id || '');
  },
  onDisable: async (context) => {
    await context.store.delete('lastMessageId');
  },
  run: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const lastMessageId = await context.store.get('lastMessageId');
    const results = [];

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [context.propsValue.label.id],
      maxResults: 10,
    });

    if (messagesResponse.data.messages) {
      let foundLastMessage = false;
      
      for (const message of messagesResponse.data.messages) {
        if (!message.id) continue;
        
        if (message.id === lastMessageId) {
          foundLastMessage = true;
          break;
        }

        const enrichedMessage = await enrichGmailMessage({
          gmail,
          messageId: message.id,
          files: context.files,
          labelInfo: {
            labelId: context.propsValue.label.id,
            labelName: context.propsValue.label.name,
          },
        });

        results.push({
          id: message.id,
          data: enrichedMessage,
        });
      }

      if (messagesResponse.data.messages.length > 0) {
        await context.store.put('lastMessageId', messagesResponse.data.messages[0].id);
      }
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
