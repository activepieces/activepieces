import { createAction, Property } from '@activepieces/pieces-framework';
import { easyPeasyAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const getAiTranscription = createAction({
  auth: easyPeasyAiAuth,
  name: 'getAiTranscription',
  displayName: 'Get AI Transcription',
  description:
    'Generate AI transcriptions from audio files with speaker detection and enhanced quality options',
  props: {
    url: Property.ShortText({
      displayName: 'Audio File URL',
      description: 'URL to the audio file to transcribe',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Transcription Name',
      description: 'Name or title for this transcription',
      required: true,
    }),
    audio_type: Property.StaticDropdown({
      displayName: 'Audio Type',
      description: 'Type of audio content being transcribed',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Podcast', value: 'podcast' },
          { label: 'Interview', value: 'interview' },
          { label: 'Meeting', value: 'meeting' },
          { label: 'Lecture', value: 'lecture' },
          { label: 'Presentation', value: 'presentation' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Language of the audio content',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'English', value: 'English' },
          { label: 'Spanish', value: 'Spanish' },
          { label: 'French', value: 'French' },
          { label: 'German', value: 'German' },
          { label: 'Italian', value: 'Italian' },
          { label: 'Portuguese', value: 'Portuguese' },
          { label: 'Dutch', value: 'Dutch' },
          { label: 'Russian', value: 'Russian' },
          { label: 'Chinese', value: 'Chinese' },
          { label: 'Japanese', value: 'Japanese' },
          { label: 'Korean', value: 'Korean' },
          { label: 'Hindi', value: 'Hindi' },
          { label: 'Arabic', value: 'Arabic' },
        ],
      },
      defaultValue: 'English',
    }),
    detect_speakers: Property.Checkbox({
      displayName: 'Detect Speakers',
      description:
        'Automatically detect and identify different speakers in the audio',
      required: false,
      defaultValue: true,
    }),
    enhanced_quality: Property.Checkbox({
      displayName: 'Enhanced Quality',
      description:
        'Use enhanced quality processing for better transcription accuracy',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      url,
      name,
      audio_type,
      language,
      detect_speakers,
      enhanced_quality,
    } = context.propsValue;

    const payload = {
      url,
      name,
      audio_type,
      language: language || 'English',
      detect_speakers: detect_speakers || true,
      enhanced_quality: enhanced_quality || true,
    };

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/api/transcriptions',
      payload
    );

    return response;
  },
});
