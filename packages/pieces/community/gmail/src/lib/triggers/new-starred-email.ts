import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail, gmail_v1 } from '@googleapis/gmail';
import { parseStream, convertAttachment } from '../common/data';
import { gmailApiErrors } from '../common/gmail-errors';
import { gmailHistory } from '../common/gmail-history';
import { newStarredEmailTriggerOutputSchema } from '../output-schemas';

const MAX_STARRED_EMAIL_AGE_MS = 2 * 24 * 60 * 60 * 1000;
const LAST_HISTORY_ID_KEY = 'lastHistoryId';

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
  async onEnable(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    await context.store.put(LAST_HISTORY_ID_KEY, profile.data.historyId);
  },
  async onDisable(context) {
    await context.store.delete(LAST_HISTORY_ID_KEY);
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const lastHistoryId = await context.store.get<string>(LAST_HISTORY_ID_KEY);

    if (!lastHistoryId) {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      await context.store.put(LAST_HISTORY_ID_KEY, profile.data.historyId);
      return [];
    }

    try {
      const { records, historyId } = await gmailHistory.listAllPages({
        gmail,
        startHistoryId: lastHistoryId,
        labelId: gmailHistory.STARRED_LABEL_ID,
        historyTypes: ['labelAdded', 'messageAdded'],
      });

      const starredMessages = gmailHistory.collectStarredMessageIds({
        records,
      });
      const cutoffTime = Date.now() - MAX_STARRED_EMAIL_AGE_MS;
      const results = [];

      for (const [messageId, historyRecordId] of starredMessages) {
        try {
          const enrichedMessage = await enrichStarredMessage({
            gmail,
            messageId,
            files: context.files,
          });
          if (enrichedMessage.internalDateMs < cutoffTime) {
            continue;
          }
          results.push({
            id: `${messageId}:${historyRecordId}`,
            data: enrichedMessage.data,
          });
        } catch (error) {
          if (gmailApiErrors.getCode(error) === 404) {
            continue;
          }
          throw error;
        }
      }

      if (historyId) {
        await context.store.put(LAST_HISTORY_ID_KEY, historyId);
      }

      return results;
    } catch (error) {
      if (gmailApiErrors.getCode(error) === 404) {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        await context.store.put(LAST_HISTORY_ID_KEY, profile.data.historyId);
        return [];
      }
      throw error;
    }
  },
  async test(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [gmailHistory.STARRED_LABEL_ID],
      q: 'newer_than:2d',
      maxResults: 5,
    });

    const results = [];
    for (const message of messagesResponse.data.messages ?? []) {
      const messageId = message.id;
      if (!messageId) {
        continue;
      }
      try {
        const enrichedMessage = await enrichStarredMessage({
          gmail,
          messageId,
          files: context.files,
        });
        results.push({
          id: messageId,
          data: enrichedMessage.data,
        });
      } catch (error) {
        if (gmailApiErrors.getCode(error) === 404) {
          continue;
        }
        throw error;
      }
    }
    return results;
  },
});

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

  const raw = rawMailResponse.data.raw;
  if (typeof raw !== 'string') {
    throw new Error(`Gmail message "${messageId}" has no raw payload.`);
  }

  const parsedMailResponse = await parseStream(
    Buffer.from(raw, 'base64').toString('utf-8')
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
