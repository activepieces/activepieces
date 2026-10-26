import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { transkriptorAuth } from '../auth';
import { BASE_URL } from '../common';
import { SUPPORTED_LANGUAGES } from '../common/languages';

export const transcribeUrlAction = createAction({
  auth: transkriptorAuth,
  name: 'transcribe_url',
  classification: 'WRITE',
  displayName: 'Transcribe from URL',
  description:
    'Starts a transcription from a YouTube, Google Drive, Dropbox, OneDrive or any public audio/video URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Submits a publicly accessible audio/video URL to Transkriptor for transcription. Supports YouTube, Google Drive, Dropbox, OneDrive, and direct media links. Returns an order ID to track the transcription. Not idempotent: each call starts a new transcription job.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'File URL',
      description:
        'Publicly reachable link to the audio or video file — YouTube, Google Drive, Dropbox, OneDrive, or any direct media URL.',
      required: true,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Spoken language of the recording.',
      required: true,
      defaultValue: 'en-US',
      options: {
        disabled: false,
        options: SUPPORTED_LANGUAGES,
      },
    }),
    service: Property.StaticDropdown({
      displayName: 'Service Type',
      description: 'Type of transcription service.',
      required: true,
      defaultValue: 'Standard',
      options: {
        disabled: false,
        options: [
          { label: 'Standard transcription', value: 'Standard' },
          { label: 'Subtitles', value: 'Subtitle' },
        ],
      },
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description:
        'Name for the transcription. Defaults to the name of the source.',
      required: false,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${BASE_URL}/transcription/url`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      body: {
        url: context.propsValue.url,
        language: context.propsValue.language,
        service: context.propsValue.service,
        ...(context.propsValue.fileName && {
          file_name: context.propsValue.fileName,
        }),
      },
    });

    return response.body;
  },
});
