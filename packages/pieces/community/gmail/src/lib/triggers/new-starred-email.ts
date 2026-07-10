import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { parseStream, convertAttachment } from '../common/data';
import { newStarredEmailTriggerOutputSchema } from '../output-schemas';

async function enrichGmailMessage({
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
    Buffer.from(rawMailResponse.data.raw as string, 'base64url').toString('utf-8')
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
  description: 'Triggers when an email is starred.',
  aiMetadata: {
    description: 'Fires when an email is marked as starred in the connected Gmail account.',
  },
  props: {},
  outputSchema: newStarredEmailTriggerOutputSchema,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const profile = await gmail.users.getProfile({
      userId: 'me',
    });

    await context.store.put('lastHistoryId', profile.data.historyId);
  },
  onDisable: async (context) => {
    await context.store.delete('lastHistoryId');
  },
  run: async (context) => {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    let lastHistoryId = await context.store.get<string | number>('lastHistoryId');
    if (!lastHistoryId) {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      await context.store.put('lastHistoryId', profile.data.historyId);
      return [];
    }

    const starredMessages = new Set<string>();
    const results = [];
    let nextPageToken: string | undefined = undefined;
    let newHistoryId: string | undefined = undefined;

    try {
      do {
        const historyResponse: any = await gmail.users.history.list({
          userId: 'me',
          startHistoryId: lastHistoryId.toString(),
          labelId: 'STARRED',
          historyTypes: ['labelAdded', 'messageAdded'],
          pageToken: nextPageToken,
        });

        if (historyResponse.data.history) {
          for (const history of historyResponse.data.history) {
            if (history.labelsAdded) {
              for (const labelAdded of history.labelsAdded) {
                if (
                  labelAdded.labelIds?.includes('STARRED') &&
                  labelAdded.message?.id
                ) {
                  starredMessages.add(labelAdded.message.id);
                }
              }
            }
            if (history.messagesAdded) {
              for (const messageAdded of history.messagesAdded) {
                if (
                  messageAdded.message?.id &&
                  messageAdded.message.labelIds?.includes('STARRED')
                ) {
                  starredMessages.add(messageAdded.message.id);
                }
              }
            }
          }
        }

        nextPageToken = historyResponse.data.nextPageToken || undefined;
        if (historyResponse.data.historyId) {
          newHistoryId = historyResponse.data.historyId.toString();
        }
      } while (nextPageToken);
    } catch (error: any) {
      const status = error.status || error.code;
      const errorMsg = error.message?.toLowerCase() || '';
      const isExpiredHistory =
        status === 404 ||
        status === 410 ||
        status === 412 ||
        (status === 400 && errorMsg.includes('historyid'));

      if (isExpiredHistory) {
        console.warn('History ID expired, resetting to latest profile history ID', error);
        const profile = await gmail.users.getProfile({ userId: 'me' });
        await context.store.put('lastHistoryId', profile.data.historyId);
        return [];
      }
      throw error;
    }

    for (const messageId of starredMessages) {
      try {
        const enrichedMessage = await enrichGmailMessage({
          gmail,
          messageId,
          files: context.files,
        });

        results.push({
          id: messageId,
          data: enrichedMessage,
        });
      } catch (error) {
        console.error(`Failed to enrich starred message ${messageId}:`, error);
      }
    }

    if (newHistoryId) {
      await context.store.put('lastHistoryId', newHistoryId);
    }

    return results;
  },
  test: async (context) => {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['STARRED'],
      maxResults: 5,
    });

    const results = [];

    if (messagesResponse.data.messages) {
      for (const message of messagesResponse.data.messages) {
        const messageId = message.id;
        if (!messageId) {
          continue;
        }
        try {
          const enrichedMessage = await enrichGmailMessage({
            gmail,
            messageId: messageId,
            files: context.files,
          });

          results.push({
            id: messageId,
            data: enrichedMessage,
          });
        } catch (error) {
          console.error(`Failed to enrich starred message test for ${messageId}:`, error);
        }
      }
    }

    return results;
  },
});
