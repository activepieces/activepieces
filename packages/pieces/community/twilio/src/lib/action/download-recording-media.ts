import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

export const twilioDownloadRecordingMedia = createAction({
  auth: twilioAuth,
  name: 'download_recording_media',
  description: 'Download a recording media file',
  displayName: 'Download Recording Media',
  props: {
    recording_sid: Property.ShortText({
      description: 'The unique identifier of the recording to download',
      displayName: 'Recording SID',
      required: true,
    }),
    format: Property.StaticDropdown({
      description: 'The format of the recording to download',
      displayName: 'Format',
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
      description: 'Number of audio channels (mono or dual-channel)',
      displayName: 'Audio Channels',
      required: false,
      defaultValue: '1',
      options: {
        options: [
          { label: 'Mono (1 channel)', value: '1' },
          { label: 'Dual-channel (2 channels)', value: '2' },
        ],
      },
    }),
  },
  async run(context) {
    const { recording_sid, format = 'mp3', channels = '1' } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    let url = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Recordings/${recording_sid}.${format}`;
    
    if (channels !== '1') {
      url += `?RequestedChannels=${channels}`;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        authentication: {
          type: AuthenticationType.BASIC,
          username: account_sid,
          password: auth_token,
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          recording_url: url,
          content: response.body,
          format: format,
          channels: channels,
          recording_sid: recording_sid,
        };
      } else {
        throw new Error(`Failed to download recording: ${response.status}`);
      }
    } catch (error: any) {
      if (channels === '2' && (error.status === 400 || error.message?.includes('400'))) {
        const monoUrl = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Recordings/${recording_sid}.${format}?RequestedChannels=1`;
        
        try {
          const retryResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: monoUrl,
            authentication: {
              type: AuthenticationType.BASIC,
              username: account_sid,
              password: auth_token,
            },
          });

          if (retryResponse.status === 200) {
            return {
              success: true,
              recording_url: monoUrl,
              content: retryResponse.body,
              format: format,
              channels: '1',
              recording_sid: recording_sid,
              note: 'Dual-channel not available, downloaded as mono',
            };
          }
        } catch (retryError) {
          throw new Error(`Failed to download recording in both dual-channel and mono: ${retryError}`);
        }
      }
      
      throw error;
    }
  },
});
