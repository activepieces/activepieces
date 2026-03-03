import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { parseStream, convertAttachment } from '../common/data';

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
    starredAt: Date.now(),
  };
}

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred',
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

    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId as string,
        historyTypes: ['labelAdded'],
      });

      const starredMessages = new Map<string, string>();

      if (historyResponse.data.history) {
        for (const history of historyResponse.data.history) {
          if (history.labelsAdded) {
            for (const labelAdded of history.labelsAdded) {
              if (
                labelAdded.labelIds?.includes('STARRED') &&
                labelAdded.message?.id
              ) {
                starredMessages.set(
                  labelAdded.message.id,
                  history.id?.toString() || ''
                );
              }
            }
          }
        }
      }

      const results = [];

      for (const [messageId, historyId] of starredMessages) {
        if (lastHistoryId !== historyId) {
          const enrichedMessage = await enrichStarredMessage({
            gmail,
            messageId,
            files: context.files,
          });

          results.push({
            id: historyId,
            data: enrichedMessage,
          });
        }
      }

      if (historyResponse.data.historyId) {
        await context.store.put(
          'lastHistoryId',
          historyResponse.data.historyId
        );
      }

      return results;
    } catch (error: any) {
      if (error.code === 404) {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        await context.store.put('lastHistoryId', profile.data.historyId);
        return [];
      }
      throw error;
    }
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

        results.push({
          id: message.id,
          data: enrichedMessage,
        });
      }
    }

    return results;
  },
});
