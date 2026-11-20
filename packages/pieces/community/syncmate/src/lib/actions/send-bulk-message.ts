import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { syncmateAuth } from '../auth';
import { syncmateRequest } from '../common/client';
import { bulkBody } from '../common/payload';
import { collectMedia, syncmateProps } from '../common/props';

export const sendBulkMessageAction = createAction({
  auth: syncmateAuth,
  name: 'sendBulkMessage',
  displayName: 'Send Bulk Message',
  description: 'Send the same WhatsApp message to many phone numbers in one step from your QR-connected number.',
  props: {
    numbers: Property.Array({
      displayName: 'Phone Numbers',
      description:
        'One number per row, with country code. A row may also hold several numbers separated by commas. Duplicates are sent once.',
      required: true,
    }),
    message: syncmateProps.message(false),
    timeGap: Property.Number({
      displayName: 'Minutes Between Messages',
      description: 'Optional. Spread the sends out, at least 5 minutes apart. Leave empty to send at once.',
      required: false,
    }),
    file: syncmateProps.attachments.file,
    fileUrl: syncmateProps.attachments.fileUrl,
    fileName: syncmateProps.attachments.fileName,
    media: syncmateProps.attachments.media,
  },
  async run({ auth, propsValue }) {
    const body = bulkBody({
      numbers: (propsValue.numbers ?? []) as unknown[],
      message: propsValue.message ?? '',
      media: await collectMedia(propsValue),
      timeGap: propsValue.timeGap ?? null,
    });

    return syncmateRequest({ auth, method: HttpMethod.POST, path: '/v1/message', body });
  },
});
