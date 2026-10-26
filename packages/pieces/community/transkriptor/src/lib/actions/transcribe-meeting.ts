import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { transkriptorAuth } from '../auth';
import { BASE_URL } from '../common';
import { SUPPORTED_LANGUAGES } from '../common/languages';

export const transcribeMeetingAction = createAction({
  auth: transkriptorAuth,
  name: 'transcribe_meeting',
  classification: 'WRITE',
  displayName: 'Transcribe Meeting',
  description:
    'Sends a bot to join and transcribe a live Google Meet, Microsoft Teams, or Zoom meeting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends the Transkriptor bot to join a running meeting at the given URL and transcribe it. Supports Google Meet, Microsoft Teams, and Zoom. The meeting must already be in progress. Not idempotent: each call dispatches a new bot.',
    idempotent: false,
  },
  props: {
    meetingUrl: Property.ShortText({
      displayName: 'Meeting URL',
      description:
        'Link to a Google Meet, Microsoft Teams, or Zoom meeting. The meeting should already be running.',
      required: true,
    }),
    meetingLanguage: Property.StaticDropdown({
      displayName: 'Language',
      description:
        'Spoken language of the meeting. Leave empty to use the platform default.',
      required: false,
      options: {
        disabled: false,
        options: SUPPORTED_LANGUAGES,
      },
    }),
    meetingBotName: Property.ShortText({
      displayName: 'Bot Name',
      description:
        'Name the bot uses when joining. Supported for Microsoft Teams and Zoom; Google Meet ignores it.',
      required: false,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${BASE_URL}/transcription/meeting`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      body: {
        meetingUrl: context.propsValue.meetingUrl,
        ...(context.propsValue.meetingLanguage && {
          meeting_language: context.propsValue.meetingLanguage,
        }),
        ...(context.propsValue.meetingBotName && {
          meeting_bot_name: context.propsValue.meetingBotName,
        }),
      },
    });

    return response.body;
  },
});
