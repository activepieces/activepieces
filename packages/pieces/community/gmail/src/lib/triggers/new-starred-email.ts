import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { parseStream, convertAttachment, getFirstFiveOrAll } from '../common/data';

async function enrichStarredMessage({
  gmail,
  messageId,
  files,
}: {
  gmail: any;
  messageId: string;
  files: FilesService;
}) {
  const rawMailResponse = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'raw',
  });

  const parsedMailResponse = await parseStream(
    Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
  );

  return {
    message: {
      id: messageId,
      threadId: rawMailResponse.data.threadId,
      labelIds: rawMailResponse.data.labelIds,
      ...parsedMailResponse,
      attachments: await convertAttachment(
        parsedMailResponse.attachments,
        files
      ),
    },
    starredAt: Date.now(),
  };
}

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const profile = await gmail.users.getProfile({ userId: 'me' });
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
      labelId: 'STARRED',
      historyTypes: ['labelAdded'],
    });

    const starredMessageIds = new Set<string>();
    const results = [];

    if (historyResponse.data.history) {
      for (const history of historyResponse.data.history) {
        if (history.labelsAdded) {
          for (const labelAdded of history.labelsAdded) {
            if (
              labelAdded.labelIds?.includes('STARRED') &&
              labelAdded.message?.id
            ) {
              starredMessageIds.add(labelAdded.message.id);
            }
          }
        }
      }
    }

    for (const messageId of starredMessageIds) {
      const enrichedMessage = await enrichStarredMessage({
        gmail,
        messageId,
        files: context.files,
      });
      results.push(enrichedMessage);
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
      labelIds: ['STARRED'],
      maxResults: 5,
    });

    const results = [];

    if (messagesResponse.data.messages) {
      for (const message of messagesResponse.data.messages) {
        if (!message.id) continue;
        const enrichedMessage = await enrichStarredMessage({
          gmail,
          messageId: message.id,
          files: context.files,
        });
        results.push(enrichedMessage);
      }
    }

    return getFirstFiveOrAll(results);
  },
});
