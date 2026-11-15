import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient, NtfyRequestError } from '../common/client';
import { attachmentInfoOutputSchema } from '../output-schemas';

export const getAttachmentInfo = createAction({
  auth: ntfyAuth,
  name: 'ntfy_get_attachment_info',
  classification: 'READ',
  displayName: 'Get Attachment Info',
  description: 'Check whether a file uploaded with a notification is still on the ntfy server, and its size.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Checks a file attachment that was uploaded to the ntfy server with a message (not attachment URLs) without downloading it, returning whether it still exists, its size and its download URL. Use before sharing an attachment link; uploaded files expire (3 hours by default). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description:
        'ID of the message the file was uploaded with, e.g. TCZJOKUErDsd (the "id" returned by Send File). A trailing file extension such as .txt is ignored.',
      required: true,
    }),
  },
  outputSchema: attachmentInfoOutputSchema,
  async run({ auth, propsValue }) {
    const messageId = ntfyClient.validateId({
      value: (propsValue.message_id ?? '').trim().replace(/\.[A-Za-z0-9]{1,16}$/, ''),
      label: 'Message ID',
    });
    const url = `${ntfyClient.baseUrl(auth)}/file/${messageId}`;
    try {
      const response = await ntfyClient.request({
        auth,
        method: HttpMethod.HEAD,
        path: `/file/${messageId}`,
      });
      const length = Number(ntfyClient.firstHeader({ headers: response.headers, name: 'content-length' }));
      return {
        message_id: messageId,
        exists: true,
        size_bytes: Number.isFinite(length) ? length : null,
        content_type: ntfyClient.firstHeader({ headers: response.headers, name: 'content-type' }) ?? null,
        url,
      };
    } catch (error) {
      if (error instanceof NtfyRequestError && error.status === 404) {
        return { message_id: messageId, exists: false, size_bytes: null, content_type: null, url };
      }
      throw error;
    }
  },
});

