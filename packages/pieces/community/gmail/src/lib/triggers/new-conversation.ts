import {
  createTrigger,
  TriggerStrategy,
  FilesService,
  Property,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail, gmail_v1 } from '@googleapis/gmail';
import { parseStream, convertAttachment } from '../common/data';
import { gmailApiErrors } from '../common/gmail-errors';
import { gmailHistory } from '../common/gmail-history';
import { newConversationTriggerOutputSchema } from '../output-schemas';

const LAST_HISTORY_ID_KEY = 'lastHistoryId';
const PROCESSED_THREADS_KEY = 'processedThreads';
const DEFAULT_MAX_AGE_HOURS = 24;
const MAX_PROCESSED_THREADS = 1000;

export const gmailNewConversationTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_conversation',
  classification: 'READ',
  displayName: 'New Conversation',
  description: 'Triggers when a new email conversation (thread) begins',
  aiMetadata: {
    description:
      'Fires when a new Gmail conversation (thread) starts, optionally filtered by sender or subject. Each event is the first message of that thread. A quick reply before the next poll still counts as a new conversation because the first-message timestamp is used, not a one-message thread length.',
  },
  props: {
    from: {
      ...GmailProps.from,
      description: 'Filter by sender email (optional)',
      displayName: 'From',
      required: false,
    },
    subject: Property.ShortText({
      displayName: 'Subject Contains',
      description:
        'Only trigger for conversations containing this text in the subject (optional)',
      required: false,
    }),
    maxAgeHours: Property.Number({
      displayName: 'Maximum Age (Hours)',
      description:
        'Only trigger for conversations started within this many hours',
      required: false,
      defaultValue: DEFAULT_MAX_AGE_HOURS,
    }),
  },
  outputSchema: newConversationTriggerOutputSchema,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    await context.store.put(LAST_HISTORY_ID_KEY, profile.data.historyId);
    await context.store.put(PROCESSED_THREADS_KEY, []);
  },
  async onDisable(context) {
    await context.store.delete(LAST_HISTORY_ID_KEY);
    await context.store.delete(PROCESSED_THREADS_KEY);
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const lastHistoryId = await context.store.get<string>(LAST_HISTORY_ID_KEY);
    const processedThreads =
      (await context.store.get<string[]>(PROCESSED_THREADS_KEY)) ?? [];
    const cutoffTime = conversationCutoffMs({
      maxAgeHours: context.propsValue.maxAgeHours,
    });

    if (!lastHistoryId) {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      await context.store.put(LAST_HISTORY_ID_KEY, profile.data.historyId);
      return [];
    }

    try {
      const { records, historyId } = await gmailHistory.listAllPages({
        gmail,
        startHistoryId: lastHistoryId,
        historyTypes: ['messageAdded'],
      });

      const threadIds = gmailHistory.collectAddedThreadIds({ records });
      const results = [];
      const newlyProcessed = [...processedThreads];

      for (const threadId of threadIds) {
        if (newlyProcessed.includes(threadId)) {
          continue;
        }
        try {
          const conversation = await enrichNewConversation({
            gmail,
            threadId,
            files: context.files,
            cutoffTime,
            fromFilter: context.propsValue.from,
            subjectFilter: context.propsValue.subject,
          });
          if (!conversation) {
            newlyProcessed.push(threadId);
            continue;
          }
          results.push(conversation);
          newlyProcessed.push(threadId);
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
      await context.store.put(
        PROCESSED_THREADS_KEY,
        newlyProcessed.slice(-MAX_PROCESSED_THREADS)
      );

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
    const cutoffTime = conversationCutoffMs({
      maxAgeHours: context.propsValue.maxAgeHours,
    });
    const cutoffSeconds = Math.floor(cutoffTime / 1000);

    let query = `after:${cutoffSeconds}`;
    if (context.propsValue.from) {
      query += ` from:(${context.propsValue.from})`;
    }
    if (context.propsValue.subject) {
      query += ` subject:(${context.propsValue.subject})`;
    }

    const threadsResponse = await gmail.users.threads.list({
      userId: 'me',
      q: query,
      maxResults: 5,
    });

    const results = [];
    for (const thread of threadsResponse.data.threads ?? []) {
      const threadId = thread.id;
      if (!threadId) {
        continue;
      }
      try {
        const conversation = await enrichNewConversation({
          gmail,
          threadId,
          files: context.files,
          cutoffTime,
          fromFilter: context.propsValue.from,
          subjectFilter: context.propsValue.subject,
        });
        if (conversation) {
          results.push(conversation);
        }
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

async function enrichNewConversation({
  gmail,
  threadId,
  files,
  cutoffTime,
  fromFilter,
  subjectFilter,
}: {
  gmail: gmail_v1.Gmail;
  threadId: string;
  files: FilesService;
  cutoffTime: number;
  fromFilter?: string;
  subjectFilter?: string;
}) {
  const threadResponse = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  const firstMessage = threadResponse.data.messages?.[0];
  if (!firstMessage?.id) {
    return null;
  }

  const messageDate = Number(firstMessage.internalDate ?? 0);
  if (
    !gmailHistory.isFirstMessageWithinCutoff({
      firstMessageInternalDate: messageDate,
      cutoffTime,
    })
  ) {
    return null;
  }

  const headerMap = headerMapFrom(firstMessage.payload?.headers);
  if (
    fromFilter &&
    !(headerMap.from ?? '').toLowerCase().includes(fromFilter.toLowerCase())
  ) {
    return null;
  }
  if (
    subjectFilter &&
    !(headerMap.subject ?? '')
      .toLowerCase()
      .includes(subjectFilter.toLowerCase())
  ) {
    return null;
  }

  const rawResponse = await gmail.users.messages.get({
    userId: 'me',
    id: firstMessage.id,
    format: 'raw',
  });
  const raw = rawResponse.data.raw;
  if (typeof raw !== 'string') {
    throw new Error(`Gmail message "${firstMessage.id}" has no raw payload.`);
  }

  const parsedMessage = await parseStream(
    Buffer.from(raw, 'base64').toString('utf-8')
  );

  return {
    id: `conversation_${threadId}`,
    data: {
      thread: {
        id: threadId,
        snippet: threadResponse.data.snippet,
        messageCount: threadResponse.data.messages?.length ?? 0,
      },
      message: {
        ...parsedMessage,
        id: firstMessage.id,
        threadId,
        date: new Date(messageDate).toISOString(),
        attachments: await convertAttachment(parsedMessage.attachments, files),
      },
      conversation: {
        starter: {
          from: headerMap.from,
          to: headerMap.to,
          subject: headerMap.subject,
          date: headerMap.date,
        },
      },
    },
  };
}

function conversationCutoffMs({
  maxAgeHours,
}: {
  maxAgeHours?: number;
}): number {
  const hours =
    typeof maxAgeHours === 'number' && maxAgeHours > 0
      ? maxAgeHours
      : DEFAULT_MAX_AGE_HOURS;
  return Date.now() - hours * 60 * 60 * 1000;
}

function headerMapFrom(
  headers: Array<{ name?: string | null; value?: string | null }> | undefined
): Record<string, string> {
  const headerMap: Record<string, string> = {};
  for (const header of headers ?? []) {
    if (header.name && header.value) {
      headerMap[header.name.toLowerCase()] = header.value;
    }
  }
  return headerMap;
}
