import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType, QueryParams } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

export const twilioDownloadRecordingMedia = createAction({
  auth: twilioAuth,
  name: 'download_recording_media',
  classification: 'READ',
  displayName: 'Download Recording Media',
  description: 'Download a call recording as an audio file.',
  audience: 'both',
  aiMetadata: { description: 'Downloads the audio file for a specific Twilio call recording by its SID, returning it as a file (MP3 or WAV). Use to retrieve recorded call audio for storage or further processing; requires the recording SID (starting with "RE"). Read-only and idempotent.', idempotent: true },
  props: {
    recording_sid: Property.ShortText({
      displayName: 'Recording SID',
      description: 'Starts with RE. Shown in the New Recording trigger output.',
      required: true,
      placeholder: 'RE0123456789abcdef0123456789abcdef',
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'MP3 files are smaller. WAV keeps full quality.',
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
        description: 'Dual keeps each caller on a separate channel, if recorded that way.',
        required: false,
        advanced: true,
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