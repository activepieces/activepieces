import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  FilesService,
} from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import {
  parseStream,
  convertAttachment,
  getFirstFiveOrAll,
} from '../common/data';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import dayjs from 'dayjs';

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_starred_email',
  displayName: 'New Starred Email',
  description:
    'Triggers when an email is starred (checks emails within the last 2 days).',
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
    const lastFetchEpochMS =
      (await context.store.get<number>('lastPoll')) ?? 0;

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
    const lastFetchEpochMS =
      (await context.store.get<number>('lastPoll')) ?? 0;

    const items = await pollStarredMessages({
      auth: context.auth,
      files: context.files,
      lastFetchEpochMS,
    });

    return getFirstFiveOrAll(items.map((item) => item.data));
  },
});

async function pollStarredMessages({
  auth,
  files,
  lastFetchEpochMS,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  files: FilesService;
  lastFetchEpochMS: number;
}): Promise<{ epochMilliSeconds: number; data: unknown }[]> {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });

  const query = ['is:starred'];
  const maxResults = lastFetchEpochMS === 0 ? 5 : 100;

  // Limit to emails within the last 2 days
  const twoDaysAgo = dayjs().subtract(2, 'day').unix();
  query.push(`after:${twoDaysAgo}`);

  const afterUnixSeconds = Math.floor(lastFetchEpochMS / 1000);
  if (afterUnixSeconds > 0) {
    query.push(`after:${afterUnixSeconds}`);
  }

  const messagesResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query.join(' '),
    maxResults,
  });

  const pollingResponse = [];
  for (const message of messagesResponse.data.messages || []) {
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
      data: {
        ...parsedMailResponse,
        attachments: await convertAttachment(
          parsedMailResponse.attachments,
          files
        ),
      },
    });
  }

  return pollingResponse;
}
