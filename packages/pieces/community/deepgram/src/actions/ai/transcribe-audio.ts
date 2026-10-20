import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { DEFAULT_STT_MODEL } from '../../common/constants';
import { transcribeAudioOutputSchema } from '../../output-schemas';
import { transcribeAudio, transcribeAudioAction } from '../transcribe-audio';

const {
  model: _model,
  audioUrl,
  audioFile,
  ...originalProps
} = transcribeAudioAction.props;

export const transcribeAudioAiAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_transcribe_audio',
  classification: 'READ',
  displayName: 'Transcribe Audio (Agent)',
  description:
    'Transcribes an audio or video file or URL and returns the transcript, with optional speakers, paragraphs, summary, topics and more.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Transcribes speech from a public audio/video URL or a file from an earlier step with Deepgram and returns the full transcript and its request_id, optionally with speaker labels, paragraphs, detected language, entities and an English-only summary, topics, intents and sentiment. Suits recordings that finish processing within about 8 minutes. Each call is billed per audio minute, so retries are billed again.',
    idempotent: false,
  },
  outputSchema: transcribeAudioOutputSchema,
  props: {
    audioUrl,
    audioFile,
    model: Property.ShortText({
      displayName: 'Model',
      description: `A Deepgram speech-to-text model: a short alias such as nova-3 or nova-2, or a canonical name from deepgram_list_models such as nova-3-general. Leave empty for ${DEFAULT_STT_MODEL}.`,
      required: false,
      defaultValue: DEFAULT_STT_MODEL,
    }),
    ...originalProps,
  },
  async run(context) {
    return transcribeAudio({
      apiKey: context.auth.secret_text,
      input: context.propsValue,
    });
  },
});
