import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  FilesService,
  Property,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { GmailLabel } from '../common/models';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { parseStream, convertAttachment } from '../common/data';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailNewAttachmentTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when an email with an attachment arrives',
  props: {
    subject: GmailProps.subject,
    from: GmailProps.from,
    to: GmailProps.to,
    label: GmailProps.label,
    category: GmailProps.category,
    file_extension: Property.ShortText({
      displayName: 'File Extension Filter',
      description:
        'Optional: Filter by file extension (e.g., pdf, jpg, docx). Leave empty for all attachments.',
      required: false,
      defaultValue: '',
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

    const items = await pollAttachmentMessages({
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

    const items = await pollAttachmentMessages({
      auth: context.auth,
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS: lastFetchEpochMS,
    });

    return getFirstFiveOrAll(items.map((item) => item.data));
  },
});

interface PropsValue {
  from: string | undefined;
  to: string | undefined;
  subject: string | undefined;
  label: GmailLabel | undefined;
  category: string | undefined;
  file_extension: string | undefined;
}

async function pollAttachmentMessages({
  auth,
  props,
  files,
  lastFetchEpochMS,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  props: PropsValue;
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

  // construct query - must have attachment
  const query = ['has:attachment'];
  const maxResults = lastFetchEpochMS === 0 ? 5 : 100;
  const afterUnixSeconds = Math.floor(lastFetchEpochMS / 1000);

  if (props.from) query.push(`from:(${props.from})`);
  if (props.to) query.push(`to:(${props.to})`);
  if (props.subject) query.push(`subject:(${props.subject})`);
  if (props.label) query.push(`label:${props.label.name}`);
  if (props.category) query.push(`category:${props.category}`);
  if (afterUnixSeconds > 0) query.push(`after:${afterUnixSeconds}`);

  // Add file extension filter if provided
  if (props.file_extension) {
    const normalizedExtension = props.file_extension
      .trim()
      .toLowerCase()
      .replace(/^\./, '');
    query.push(`filename:${normalizedExtension}`);
  }

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
    const threadResponse = await gmail.users.threads.get({
      userId: 'me',
      id: message.threadId!,
    });

    const parsedMailResponse = await parseStream(
      Buffer.from(rawMailResponse.data.raw as string, 'base64').toString(
        'utf-8'
      )
    );

    // Only include messages that actually have attachments
    if (
      parsedMailResponse.attachments &&
      parsedMailResponse.attachments.length > 0
    ) {
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
