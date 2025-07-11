import {
  createTrigger,
  TriggerStrategy,
  Property,
  PiecePropValueSchema,
  FilesService,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import {
  parseStream,
  convertAttachment,
  getFirstFiveOrAll,
} from '../common/data';
import { GmailLabel } from '../common/models';
import dayjs from 'dayjs';

type Props = {
  from?: string;
  to?: string;
  subject?: string;
  label?: GmailLabel;
  category?: string;
  filenameExtension?: string;
};

export const gmailNewAttachmentTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when an email with an attachment arrives.',
  props: {
    from: {
      ...GmailProps.from,
      description: 'Filter by sender email.',
      displayName: 'From',
      required: false,
    },
    to: {
      ...GmailProps.to,
      description: 'Filter by recipient email.',
      displayName: 'To',
      required: false,
    },
    subject: Property.ShortText({
      displayName: 'Subject Contains',
      description:
        'Only trigger for emails containing this text in the subject.',
      required: false,
    }),
    label: {
      ...GmailProps.label,
      description: 'Filter by Gmail label.',
      displayName: 'Label',
      required: false,
    },
    category: {
      ...GmailProps.category,
      description: 'Filter by Gmail category.',
      displayName: 'Category',
      required: false,
    },
    filenameExtension: Property.ShortText({
      displayName: 'File Extension',
      description:
        'Only trigger for attachments with this file extension (e.g., pdf, jpg, docx).',
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

    const items = await pollRecentMessages({
      auth: context.auth,
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS: lastFetchEpochMS,
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

    const items = await pollRecentMessages({
      auth: context.auth,
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS: lastFetchEpochMS,
    });

    return getFirstFiveOrAll(items.map((item) => item.data));
  },
});

async function pollRecentMessages({
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

  // construct query
  const query = ['has:attachment'];
  const maxResults = lastFetchEpochMS === 0 ? 5 : 100;
  const afterUnixSeconds = Math.floor(lastFetchEpochMS / 1000);

  if (props.from) query.push(`from:(${props.from})`);
  if (props.to) query.push(`to:(${props.to})`);
  if (props.subject) query.push(`subject:(${props.subject})`);
  if (props.label) query.push(`label:${props.label.name}`);
  if (props.category) query.push(`category:${props.category}`);
  if (props.filenameExtension)
    query.push(`filename:${props.filenameExtension}`);
  if (afterUnixSeconds != null && afterUnixSeconds > 0)
    query.push(`after:${afterUnixSeconds}`);

  // List Messages
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

    const { attachments, ...restOfParsedMailResponse } = parsedMailResponse;
    const parsedAttachments = await convertAttachment(attachments, files);

    for (const attachment of parsedAttachments) {
      pollingResponse.push({
        epochMilliSeconds: dayjs(restOfParsedMailResponse.date).valueOf(),
        data: {
          attachment,
          message: {
            id: message.id,
            ...restOfParsedMailResponse,
          },
        },
      });
    }
  }

  return pollingResponse;
}
