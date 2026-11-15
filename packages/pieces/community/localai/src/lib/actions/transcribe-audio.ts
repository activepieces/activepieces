import { createAction, Property } from '@activepieces/pieces-framework';
import { toFile } from 'openai';
import { localaiAuth } from '../auth';
import { localaiCommon } from '../common';
import { transcribeAudioOutputSchema } from '../output-schemas';

export const transcribeAudio = createAction({
  audience: 'both',
  auth: localaiAuth,
  name: 'transcribe_audio',
  classification: 'READ',
  displayName: 'Transcribe Audio',
  description: 'Turn speech in an audio file into text.',
  aiMetadata: { description: 'Transcribes the speech in an audio file into text with a speech-recognition model installed on the connected self-hosted LocalAI server (for example a whisper model), so the audio never leaves your infrastructure. Takes a file from an earlier step (wav, mp3, ogg, m4a and other formats ffmpeg can read) and an optional language hint, and returns the full text plus timed segments. The model must be a transcription model, not a chat model: call list_models when unsure. Read-only; repeat calls on the same file return the same text.', idempotent: true },
  props: {
    model: localaiCommon.modelDropdown({
      displayName: 'Model',
      description:
        'A speech-recognition model (for example whisper) installed on your LocalAI server.',
    }),
    audio: Property.File({
      displayName: 'Audio',
      description: 'The recording to transcribe.',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code of the speech. Empty auto-detects.',
      placeholder: 'e.g. en',
      required: false,
    }),
  },
  outputSchema: transcribeAudioOutputSchema,
  async run({ auth, propsValue }) {
    const { model, audio, language } = propsValue;
    try {
      const file = await toFile(audio.data, audio.filename);
      const response = await localaiCommon
        .client(auth)
        .audio.transcriptions.create({
          model,
          file,
          response_format: 'verbose_json',
          ...(language?.trim() ? { language: language.trim() } : {}),
        });
      return {
        text: response.text.trim(),
        duration: response.duration ?? null,
        segments: (response.segments ?? []).map((segment) => ({
          id: segment.id,
          start: segment.start,
          end: segment.end,
          text: segment.text.trim(),
        })),
      };
    } catch (error) {
      throw localaiCommon.friendlyError(error);
    }
  },
});
