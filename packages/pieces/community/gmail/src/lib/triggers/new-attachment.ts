import {
  createTrigger,
  TriggerStrategy,
  FilesService,
  Property,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth, createGoogleClient, GmailAuthValue } from '../auth';
import { gmail as googleGmail, gmail_v1 } from '@googleapis/gmail';
import { parseRawMessage, convertAttachment } from '../common/data';
import { gmailMessagePoll } from '../common/message-poll';
import { GmailLabel } from '../common/models';
import { newAttachmentTriggerOutputSchema } from '../output-schemas';

export const gmailNewAttachmentTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_attachment',
  classification: 'READ',
  displayName: 'New Attachment',
  description: 'Triggers for each attachment on a new email.',
  aiMetadata: {
    description:
      'Fires when a new email carrying one or more attachments arrives, optionally narrowed by sender, recipient, subject, label, category, or file extension. Each event represents a single attachment (a multi-attachment email emits one event per attachment) along with its source message.',
  },
  props: {
    from: GmailProps.from,
    to: { ...GmailProps.to, advanced: true },
    subject: GmailProps.subject,
    label: GmailProps.label({ required: false }),
    category: { ...GmailProps.category, advanced: true },
    filenameExtension: Property.ShortText({
      displayName: 'File Extension',
      description: 'Only attachments with this extension.',
      placeholder: 'pdf',
      required: false,
    }),
  },
  outputSchema: newAttachmentTriggerOutputSchema,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await gmailMessagePoll.enable({
      store: context.store,
      isRepublish: context.isRepublish,
    });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const gmail = await createGmail(context.auth);
    return gmailMessagePoll.poll({
      gmail,
      store: context.store,
      query: buildQuery(context.propsValue),
      labelId: context.propsValue.label?.id,
      toItems: (message) =>
        toAttachmentItems({
          message,
          files: context.files,
          extension: context.propsValue.filenameExtension,
        }),
    });
  },
  async test(context) {
    const gmail = await createGmail(context.auth);
    return gmailMessagePoll.sample({
      gmail,
      query: buildQuery(context.propsValue),
      labelId: context.propsValue.label?.id,
      toItems: (message) =>
        toAttachmentItems({
          message,
          files: context.files,
          extension: context.propsValue.filenameExtension,
        }),
    });
  },
});

async function createGmail(auth: GmailAuthValue): Promise<gmail_v1.Gmail> {
  const authClient = await createGoogleClient(auth);
  return googleGmail({ version: 'v1', auth: authClient });
}

function buildQuery(props: Props): string[] {
  return [
    'has:attachment',
    ...(props.from ? [`from:(${props.from})`] : []),
    ...(props.to ? [`to:(${props.to})`] : []),
    ...(props.subject ? [`subject:(${props.subject})`] : []),
    ...(props.category ? [`category:${props.category}`] : []),
    ...(props.filenameExtension ? [`filename:${props.filenameExtension}`] : []),
  ];
}

async function toAttachmentItems({
  message,
  files,
  extension,
}: {
  message: gmail_v1.Schema$Message;
  files: FilesService;
  extension: string | undefined;
}): Promise<unknown[]> {
  const { attachments, ...parsedMail } = await parseRawMessage(message.raw);
  const suffix = extension?.trim().replace(/^\./, '').toLowerCase();
  const matching = suffix
    ? attachments.filter((attachment) =>
        (attachment.filename ?? '').toLowerCase().endsWith(`.${suffix}`)
      )
    : attachments;
  const converted = await convertAttachment(matching, files);
  return converted.map((attachment) => ({
    attachment,
    message: {
      id: message.id,
      ...parsedMail,
    },
  }));
}

type Props = {
  from?: string;
  to?: string;
  subject?: string;
  label?: GmailLabel;
  category?: string;
  filenameExtension?: string;
};
