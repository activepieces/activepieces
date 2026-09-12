import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import {
  slackChannel,
} from '../common/props';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import { uploadFileActionOutputSchema } from '../output-schemas';

export const uploadFile = createAction({
  auth: slackAuth,
  name: 'uploadFile',
  classification: 'WRITE',
  displayName: 'Upload File',
  description: 'Uploads a file, optionally into a channel.',
  audience: 'both',
  aiMetadata: { description: 'Upload a file to Slack, optionally sharing it into a channel and setting a title and filename. Each call creates a new file, so it is not idempotent. To attach a file inline with a message instead, use the attachment option on Send Message To A Channel.', idempotent: false },
  outputSchema: uploadFileActionOutputSchema,
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: "Shown as the file's title in Slack.",
      placeholder: 'Q3 report',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'File name including its extension.',
      placeholder: 'report.pdf',
      required: false,
    }),
    channel: slackChannel(false),
  },
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const { file, title, filename, channel } = context.propsValue;
    const client = new WebClient(token);
    return await client.files.uploadV2({
      file_uploads: [{ file: file.data, filename: filename || file.filename }],
      title: title,
      channel_id: channel,
    });
  },
});
