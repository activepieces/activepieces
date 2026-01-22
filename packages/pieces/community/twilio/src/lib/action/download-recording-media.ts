import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType, QueryParams } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

export const twilioDownloadRecordingMedia = createAction({
  auth: twilioAuth,
  name: 'download_recording_media',
  displayName: 'Download Recording Media',
  description: 'Download the media file for a specific recording.',
  props: {
    recording_sid: Property.ShortText({
      displayName: 'Recording SID',
      description: 'The unique identifier (SID) of the recording to download. It starts with "RE".',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'The desired audio format for the download file.',
      required: false,
      defaultValue: 'mp3',
      options: {
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' },
        ],
      },
    }),
    channels: Property.StaticDropdown({
        displayName: 'Channels',
        description: 'Specify whether to download a mono or dual-channel file. Note: Dual-channel may not be available for all recordings.',
        required: false,
        options: {
            options: [
                { label: 'Mono', value: 1 },
                { label: 'Dual', value: 2 },
            ]
        }
    })
  },
  async run(context) {
    const { recording_sid, format, channels } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    const fileFormat = format ?? 'mp3';
    const path = `Recordings/${recording_sid}.${fileFormat}`;

    const queryParams: QueryParams = {};
    if (channels) {
        queryParams['RequestedChannels'] = channels.toString();
    }

    const response = await httpClient.sendRequest<ArrayBuffer>({
      method: HttpMethod.GET,
      url: `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/${path}`,
      queryParams: queryParams,
      authentication: {
        type: AuthenticationType.BASIC,
        username: account_sid,
        password: auth_token,
      },
      responseType: 'arraybuffer',
    });

    const fileData = Buffer.from(response.body);

    return await context.files.write({
      fileName: `${recording_sid}.${fileFormat}`,
      data: fileData,
    });
  },
});