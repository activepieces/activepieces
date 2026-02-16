import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  FilesService,
  Property,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { parseStream, convertAttachment, getFirstFiveOrAll } from '../common/data';
import dayjs from 'dayjs';

type Props = {
  from?: string;
  to?: string;
  subject?: string;
};

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred (within 2 days).',
  props: {
    from: {
      ...GmailProps.from,
      description: 'Filter by sender email (optional).',
      displayName: 'From',
      required: false,
    },
    to: {
      ...GmailProps.to,
      description: 'Filter by recipient email (optional).',
      displayName: 'To',
      required: false,
    },
    subject: Property.ShortText({
      displayName: 'Subject Contains',
      description:
        'Only trigger for emails containing this text in the subject (optional).',
      required: false,
    }),
  },
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
      props: context.propsValue,
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
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS,
    });

    return getFirstFiveOrAll(items.map((item) => item.data));
  },
});

async function pollStarredMessages({
  auth,
  props,
  files,
  lastFetchEpochMS,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  props: Props;
  files: FilesService;
  lastFetchEpochMS: number;
}): Promise<
  {
    epochMilliSeconds: number;
    data: unknown;
  }[]
> {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });

  const query = ['is:starred'];
  const maxResults = lastFetchEpochMS === 0 ? 5 : 100;

  // Look back 2 days max
  const twoDaysAgo = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000);
  const afterUnixSeconds = Math.max(
    Math.floor(lastFetchEpochMS / 1000),
    twoDaysAgo
  );

  if (props.from) query.push(`from:(${props.from})`);
  if (props.to) query.push(`to:(${props.to})`);
  if (props.subject) query.push(`subject:(${props.subject})`);
  if (afterUnixSeconds > 0) query.push(`after:${afterUnixSeconds}`);

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
      Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
    );

    pollingResponse.push({
      epochMilliSeconds: dayjs(parsedMailResponse.date).valueOf(),
      data: {
        id: message.id,
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
