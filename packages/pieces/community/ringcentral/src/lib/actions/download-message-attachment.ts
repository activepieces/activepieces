import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ringcentralAuth } from '../common/auth';
import { ringcentralCommon } from '../common/client';

export const downloadMessageAttachment = createAction({
  auth: ringcentralAuth,
  name: 'download_message_attachment',
  displayName: 'Download Message Attachment',
  description:
    'Download the content of a message attachment, such as an MMS photo or a voicemail recording, and return it as a file.',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The message the attachment belongs to.',
      required: true,
    }),
    attachmentId: Property.ShortText({
      displayName: 'Attachment ID',
      description:
        'Which attachment to download. Leave blank to take the first one that is not the message text, which is the usual case for an MMS carrying a single photo.',
      required: false,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description:
        "Overrides the name RingCentral reports. Worth setting when the name matters downstream, e.g. naming a POD after the load number.",
      required: false,
    }),
  },
  async run(context) {
    const { messageId, attachmentId, fileName } = context.propsValue;

    // Read the message first, the same shape as other pieces' download actions: it resolves the
    // attachment id when the caller did not supply one, and gives the reported file name. It also
    // turns a wrong id into a clear message rather than a bare 404 from the content endpoint.
    const message = await ringcentralCommon.sendRequest<MessageWithAttachments>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourcePath: `/restapi/v1.0/account/~/extension/~/message-store/${encodeURIComponent(
        messageId,
      )}`,
    });

    const attachments = message.attachments ?? [];
    if (attachments.length === 0) {
      throw new Error(
        `Message ${messageId} carries no attachments. An SMS with no media has none, so check the message id or use Get Message to inspect it.`,
      );
    }

    const attachment = attachmentId
      ? attachments.find((a) => String(a.id) === String(attachmentId))
      : // 'Text' is the SMS body itself, which is already on the trigger payload and is not the file
        // anyone means by "the attachment", so it is skipped when picking a default.
        (attachments.find((a) => a.type !== 'Text') ?? attachments[0]);

    if (!attachment) {
      throw new Error(
        `Message ${messageId} has no attachment ${attachmentId}. It carries: ${attachments
          .map((a) => `${a.id} (${a.type ?? 'unknown type'})`)
          .join(', ')}.`,
      );
    }

    const content = await ringcentralCommon.sendRequest<ArrayBuffer>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourcePath: `/restapi/v1.0/account/~/extension/~/message-store/${encodeURIComponent(
        messageId,
      )}/content/${encodeURIComponent(String(attachment.id))}`,
      responseType: 'arraybuffer',
    });

    const reportedName = attachment.fileName ?? attachment.filename;
    const file = await context.files.write({
      fileName: fileName ?? reportedName ?? `ringcentral-${messageId}-${attachment.id}`,
      data: Buffer.from(content),
    });

    return { file, attachment };
  },
});

type MessageAttachment = {
  id?: string | number;
  type?: string;
  contentType?: string;
  size?: number;
  // RingCentral has shipped both spellings across API versions, so read either.
  fileName?: string;
  filename?: string;
};

type MessageWithAttachments = {
  id?: string | number;
  attachments?: MessageAttachment[];
};
