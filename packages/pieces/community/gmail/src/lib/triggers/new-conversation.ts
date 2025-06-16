import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { gmailAuth } from '../../';
import { parseStream, convertAttachment } from '../common/data';

export const gmailNewConversationTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_conversation',
  displayName: 'New Conversation',
  description: 'Fires when a new conversation (thread) begins.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastPoll', Date.now());
  },
  async onDisable(context) {
    return;
  },
  async run(context) {
    const lastFetchEpochMS = (await context.store.get<number>('lastPoll')) ?? 0;

    const items = await pollNewConversations({
      auth: context.auth,
      files: context.files,
      lastFetchEpochMS,
    });

    const newLastEpochMilliSeconds = items.reduce(
      (acc, item) => Math.max(acc, item.epochMilliSeconds),
      lastFetchEpochMS
    );
    await context.store.put('lastPoll', newLastEpochMilliSeconds);
    return items
      .filter((f) => f.epochMilliSeconds > lastFetchEpochMS)
      .map((item) => item.data);
  },
  async test(context) {
    const lastFetchEpochMS = (await context.store.get<number>('lastPoll')) ?? 0;

    const items = await pollNewConversations({
      auth: context.auth,
      files: context.files,
      lastFetchEpochMS,
    });

    return getFirstFiveOrAll(items.map((item) => item.data));
  },
});

async function pollNewConversations({ auth, files, lastFetchEpochMS }) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });
  const query = [`after:${Math.floor(lastFetchEpochMS / 1000)}`];

  const threadsResponse = await gmail.users.threads.list({
    userId: 'me',
    q: query.join(' '),
    maxResults: 50,
  });

  const pollingResponse = [];
  for (const thread of threadsResponse.data.threads || []) {
    const threadResponse = await gmail.users.threads.get({
      userId: 'me',
      id: thread.id!,
    });

    if (
      threadResponse.data.messages &&
      threadResponse.data.messages.length > 0
    ) {
      const firstMessage = threadResponse.data.messages[0];
      const rawMailResponse = await gmail.users.messages.get({
        userId: 'me',
        id: firstMessage.id!,
        format: 'raw',
      });

      const parsedMailResponse = await parseStream(
        Buffer.from(rawMailResponse.data.raw as string, 'base64').toString(
          'utf-8'
        )
      );

      pollingResponse.push({
        epochMilliSeconds: dayjs(parsedMailResponse.date).valueOf(),
        data: {
          message: {
            ...parsedMailResponse,
            attachments: await convertAttachment(
              parsedMailResponse.attachments,
              files
            ),
          },
          thread: {
            ...threadResponse,
          },
        },
      });
    }
  }

  return pollingResponse;
}
