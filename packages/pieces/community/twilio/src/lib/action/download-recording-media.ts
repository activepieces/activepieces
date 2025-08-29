import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

export const twilioDownloadRecordingMedia = createAction({
  auth: twilioAuth,
  name: 'download_recording_media',
  displayName: 'Download Recording Media',
  description: 'Download a recording media file',
  props: {
    recording_sid: Property.ShortText({
      displayName: 'Recording SID',
      description: 'The unique identifier of the recording to download',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'The format of the recording file to download',
      required: false,
      defaultValue: 'mp3',
      options: {
        disabled: false,
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' },
        ],
      },
    }),
  },
  async run(context) {
    const { recording_sid, format = 'mp3' } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Recordings/${recording_sid}.${format}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
      authentication: {
        type: AuthenticationType.BASIC,
        username: account_sid,
        password: auth_token,
      },
    });

    // Return the response with media data
    return {
      recording_sid,
      format,
      media_url: url,
      content_type: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
      data: response.body,
    };
  },
});
