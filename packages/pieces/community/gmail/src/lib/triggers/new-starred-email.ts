import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail, gmail_v1 } from '@googleapis/gmail';
import { parseStream, convertAttachment } from '../common/data';
import { getGmailApiErrorCode } from '../common/errors';
import { newStarredEmailTriggerOutputSchema } from '../output-schemas';

const STARRED_LABEL_ID = 'STARRED';
const MAX_STARRED_EMAIL_AGE_MS = 2 * 24 * 60 * 60 * 1000;

async function enrichStarredMessage({
  gmail,
  messageId,
  files,
}: {
  gmail: gmail_v1.Gmail;
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
    id: rawMailResponse.data.threadId ?? undefined,
  });

  const parsedMailResponse = await parseStream(
    Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
  );

  return {
    internalDateMs: Number(rawMailResponse.data.internalDate ?? 0),
    data: {
      message: {
        ...parsedMailResponse,
        attachments: await convertAttachment(
          parsedMailResponse.attachments,
          files
        ),
      },
      thread: threadResponse.data,
      starInfo: {
        messageId,
        starredAt: Date.now(),
      },
    },
  };
}

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  classification: 'READ',
  displayName: 'New Starred Email',
  description:
    'Triggers when an email is starred (for emails received within the last 2 days)',
  aiMetadata: {
    description:
      'Fires once per email message that gets starred, limited to messages received within the last 2 days. Each payload carries the parsed starred message, its thread, and when the star was detected.',
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

    const lastHistoryId = await context.store.get('lastHistoryId');
    const cutoffTime = Date.now() - MAX_STARRED_EMAIL_AGE_MS;

    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId as string,
        labelId: STARRED_LABEL_ID,
        historyTypes: ['labelAdded', 'messageAdded'],
      });

      const starredMessages = new Map<string, string>();
      const results = [];

      if (historyResponse.data.history) {
        for (const history of historyResponse.data.history) {
          if (history.labelsAdded) {
            for (const labelAdded of history.labelsAdded) {
              if (
                labelAdded.labelIds?.includes(STARRED_LABEL_ID) &&
                labelAdded.message?.id
              ) {
                starredMessages.set(
                  labelAdded.message.id,
                  history.id?.toString() || ''
                );
              }
            }
          } else if (history.messagesAdded) {
            for (const messageAdded of history.messagesAdded) {
              if (
                messageAdded.message?.id &&
                messageAdded.message.labelIds?.includes(STARRED_LABEL_ID)
              ) {
                starredMessages.set(
                  messageAdded.message.id,
                  history.id?.toString() || ''
                );
              }
            }
          }
        }
      }

      for (const [messageId, historyId] of starredMessages) {
        const enrichedMessage = await enrichStarredMessage({
          gmail,
          messageId,
          files: context.files,
        });

        if (enrichedMessage.internalDateMs < cutoffTime) {
          continue;
        }

        if (lastHistoryId !== historyId) {
          results.push({
            id: `${messageId}_${historyId}`,
            data: enrichedMessage.data,
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
    } catch (error) {
      if (getGmailApiErrorCode(error) === 404) {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        await context.store.put('lastHistoryId', profile.data.historyId);
        return [];
      }
      throw error;
    }
  },
  test: async (context) => {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [STARRED_LABEL_ID],
      q: 'newer_than:2d',
      maxResults: 5,
    });

    const results = [];

    if (messagesResponse.data.messages) {
      for (const message of messagesResponse.data.messages) {
        const messageId = message.id;
        if (!messageId) {
          continue;
        }
        const enrichedMessage = await enrichStarredMessage({
          gmail,
          messageId,
          files: context.files,
        });

        results.push({
          id: messageId,
          data: enrichedMessage.data,
        });
      }
    }

    return results;
  },
});
