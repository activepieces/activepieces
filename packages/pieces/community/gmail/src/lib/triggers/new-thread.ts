import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  FilesService,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { parseStream, convertAttachment } from '../common/data';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailNewThreadTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_thread',
  displayName: 'New Conversation',
  description: 'Triggers when a new email thread/conversation begins',
  props: {
    from: GmailProps.from,
    to: GmailProps.to,
    label: GmailProps.label,
    category: GmailProps.category,
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastPoll', Date.now());
    await context.store.put('knownThreadIds', JSON.stringify([]));
  },
  async onDisable(context) {
    return;
  },
  async run(context) {
    const lastFetchEpochMS = (await context.store.get<number>('lastPoll')) ?? 0;
    const knownThreadIdsJson = (await context.store.get<string>('knownThreadIds')) ?? '[]';
    const knownThreadIds: string[] = JSON.parse(knownThreadIdsJson);

    const items = await pollNewThreads({
      auth: context.auth,
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS,
    });

    // Update known thread IDs
    const allThreadIds = new Set([...knownThreadIds, ...items.map((item) => item.threadId)]);
    await context.store.put('lastPoll', Date.now());
    await context.store.put('knownThreadIds', JSON.stringify([...allThreadIds].slice(-1000)));

    // Return only truly new threads
    return items
      .filter((item) => !knownThreadIds.includes(item.threadId))
      .map((item) => item.data);
  },
  async test(context) {
    const items = await pollNewThreads({
      auth: context.auth,
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS: 0,
    });

    return items.slice(0, 5).map((item) => item.data);
  },
});

interface PropsValue {
  from: string | undefined;
  to: string | undefined;
  label: { id: string; name: string } | undefined;
  category: string | undefined;
}

async function pollNewThreads({
  auth,
  props,
  files,
  lastFetchEpochMS,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  props: PropsValue;
  files: FilesService;
  lastFetchEpochMS: number;
}): Promise<{ threadId: string; epochMilliSeconds: number; data: unknown }[]> {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  const gmail = google.gmail({ version: 'v1', auth: authClient });

  const query = [];
  const maxResults = lastFetchEpochMS === 0 ? 5 : 50;
  const afterUnixSeconds = Math.floor(lastFetchEpochMS / 1000);

  if (props.from) query.push(`from:(${props.from})`);
  if (props.to) query.push(`to:(${props.to})`);
  if (props.label) query.push(`label:${props.label.name}`);
  if (props.category) query.push(`category:${props.category}`);
  if (afterUnixSeconds > 0) query.push(`after:${afterUnixSeconds}`);

  const threadsResponse = await gmail.users.threads.list({
    userId: 'me',
    q: query.join(' '),
    maxResults,
  });

  const pollingResponse = [];
  for (const thread of threadsResponse.data.threads || []) {
    const threadResponse = await gmail.users.threads.get({
      userId: 'me',
      id: thread.id!,
      format: 'full',
    });

    // Check if this is a new thread (only 1 message or first message is recent)
    const messages = threadResponse.data.messages || [];
    if (messages.length === 1) {
      const firstMessage = messages[0];
      const rawMailResponse = await gmail.users.messages.get({
        userId: 'me',
        id: firstMessage.id!,
        format: 'raw',
      });

      const parsedMailResponse = await parseStream(
        Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
      );

      pollingResponse.push({
        threadId: thread.id!,
        epochMilliSeconds: dayjs(parsedMailResponse.date).valueOf(),
        data: {
          thread: threadResponse.data,
          firstMessage: {
            ...parsedMailResponse,
            attachments: await convertAttachment(parsedMailResponse.attachments, files),
          },
        },
      });
    }
  }

  return pollingResponse;
}
