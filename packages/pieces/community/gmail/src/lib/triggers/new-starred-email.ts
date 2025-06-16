import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { gmailAuth } from '../../';
import { parseStream, convertAttachment } from '../common/data';

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_starred_email',
  displayName: 'New Starred Email',
  description: 'Fires when an email is starred (within 2 days).',
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

    const items = await pollStarredMessages({
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

    const items = await pollStarredMessages({
      auth: context.auth,
      files: context.files,
      lastFetchEpochMS,
    });

    return getFirstFiveOrAll(items.map((item) => item.data));
  },
});

async function pollStarredMessages({ auth, files, lastFetchEpochMS }) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });
  const query = [
    `is:starred`,
    `after:${Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000)}`,
  ];

  const messagesResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query.join(' '),
    maxResults: 50,
  });

  const pollingResponse = [];
  for (const message of messagesResponse.data.messages || []) {
    const rawMailResponse = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'raw',
    });
    const threadResponse = await gmail.users.threads.get({
      userId: 'me',
      id: message.threadId!,
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

  return pollingResponse;
}
