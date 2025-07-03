import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../../index';
import { WebClient } from '@slack/web-api';
import {
  slackChannel,
} from '../common/props';

export const uploadFile = createAction({
  auth: slackAuth,
  name: 'uploadFile',
  displayName: 'Upload file',
  description: 'Upload file without sharing it to a channel or user',
  props: {
    file: Property.File({
      displayName: 'Attachment',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      required: false,
    }),
    channel: slackChannel(false),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { file, title, filename, channel } = context.propsValue;
    const client = new WebClient(token);
    return await client.files.uploadV2({
      file_uploads: [{ file: file.data, filename: filename || file.filename }],
      title: title,
      channel_id: channel,
    });
  },
});
