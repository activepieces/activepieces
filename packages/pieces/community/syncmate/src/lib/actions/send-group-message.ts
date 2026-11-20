import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { syncmateAuth } from '../auth';
import { syncmateRequest } from '../common/client';
import { assertSendable, groupJid, RecipientType, singleBody, standardMessage } from '../common/payload';
import { collectMedia, syncmateProps } from '../common/props';

export const sendGroupMessageAction = createAction({
  auth: syncmateAuth,
  name: 'groupSend',
  displayName: 'Send Message to Group',
  description: 'Send a WhatsApp message, with optional attachments, to a group your QR-connected number is in.',
  props: {
    group: syncmateProps.group,
    number: Property.ShortText({
      displayName: 'Group ID',
      description:
        'Used when no group is picked above, e.g. from an earlier step. Format 1203630xxxxxxxx@g.us; the @g.us part is added if missing.',
      required: false,
    }),
    message: syncmateProps.message(false),
    file: syncmateProps.attachments.file,
    fileUrl: syncmateProps.attachments.fileUrl,
    fileName: syncmateProps.attachments.fileName,
    media: syncmateProps.attachments.media,
  },
  async run({ auth, propsValue }) {
    const message = standardMessage({
      number: groupJid(propsValue.group || propsValue.number),
      message: propsValue.message,
      type: RecipientType.GROUP,
      media: await collectMedia(propsValue),
    });
    assertSendable(message, 'group (pick one or enter its Group ID)');

    return syncmateRequest({ auth, method: HttpMethod.POST, path: '/v1/message', body: singleBody(message) });
  },
});
