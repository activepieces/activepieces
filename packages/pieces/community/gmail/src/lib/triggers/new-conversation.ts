import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  FilesService,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { gmailAuth } from '../../';
import { parseStream, convertAttachment } from '../common/data';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailNewConversationTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_conversation',
  displayName: 'New Conversation',
  description: 'Triggers when a new conversation (thread) begins',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastPoll', Date.now());
    await context.store.put('seenThreadIds', JSON.stringify([]));
  },
  async onDisable(context) {
    await context.store.delete('seenThreadIds');
  },
  async run(context) {
    const lastFetchEpochMS = (await context.store.get<number>('lastPoll')) ?? 0;
    const seenThreadIdsJson =
      (await context.store.get<string>('seenThreadIds')) ?? '[]';
    const seenThreadIds = new Set<string>(JSON.parse(seenThreadIdsJson));

    const items = await pollNewConversations({
      auth: context.auth,
      files: context.files,
      lastFetchEpochMS: lastFetchEpochMS,
      seenThreadIds,
    });

    const newLastEpochMilliSeconds = items.reduce(
      (acc, item) => Math.max(acc, item.epochMilliSeconds),
      lastFetchEpochMS
    );
    await context.store.put('lastPoll', newLastEpochMilliSeconds);

    // Update seen thread IDs
    items.forEach((item) => {
      if (item.threadId) {
        seenThreadIds.add(item.threadId);
      }
    });
    await context.store.put(
      'seenThreadIds',
      JSON.stringify(Array.from(seenThreadIds))
    );

    return items
      .filter((f) => f.epochMilliSeconds > lastFetchEpochMS)
      .map((item) => item.data);
  },
  async test(context) {
    const lastFetchEpochMS = (await context.store.get<number>('lastPoll')) ?? 0;
    const seenThreadIds = new Set<string>();

    const items = await pollNewConversations({
      auth: context.auth,
      files: context.files,
      lastFetchEpochMS: lastFetchEpochMS,
      seenThreadIds,
    });

    return getFirstFiveOrAll(items.map((item) => item.data));
  },
});

async function pollNewConversations({
  auth,
  files,
  lastFetchEpochMS,
  seenThreadIds,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  files: FilesService;
  lastFetchEpochMS: number;
  seenThreadIds: Set<string>;
}): Promise<
  {
    epochMilliSeconds: number;
    threadId: string;
    data: unknown;
  }[]
> {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });

  // construct query
  const query = [];
  const maxResults = lastFetchEpochMS === 0 ? 5 : 100;
  const afterUnixSeconds = Math.floor(lastFetchEpochMS / 1000);

  if (afterUnixSeconds > 0) {
    query.push(`after:${afterUnixSeconds}`);
  }

  // List Messages
  const messagesResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query.join(' '),
    maxResults,
  });

  const pollingResponse = [];
  const processedThreads = new Set<string>();

  for (const message of messagesResponse.data.messages || []) {
    const threadId = message.threadId!;

    // Skip if we've already seen this thread or processed it in this batch
    if (seenThreadIds.has(threadId) || processedThreads.has(threadId)) {
      continue;
    }

    processedThreads.add(threadId);

    const threadResponse = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });

    // A new conversation has only one message
    if (
      threadResponse.data.messages &&
      threadResponse.data.messages.length === 1
    ) {
      const rawMailResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'raw',
      });

      const parsedMailResponse = await parseStream(
        Buffer.from(rawMailResponse.data.raw as string, 'base64').toString(
          'utf-8'
        )
      );

      pollingResponse.push({
        epochMilliSeconds: dayjs(parsedMailResponse.date).valueOf(),
        threadId: threadId,
        data: {
          message: {
            ...parsedMailResponse,
            attachments: await convertAttachment(
              parsedMailResponse.attachments,
              files
            ),
          },
          thread: {
            ...threadResponse.data,
          },
        },
      });
    }
  }

  return pollingResponse;
}

function getFirstFiveOrAll(array: unknown[]) {
  if (array.length <= 5) {
    return array;
  } else {
    return array.slice(0, 5);
  }
}
