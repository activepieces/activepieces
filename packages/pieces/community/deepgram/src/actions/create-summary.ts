import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAudio } from '../common/audio';
import { deepgramAuth } from '../common/auth';
import { LANG_OPTIONS } from '../common/constants';
import { deepgramProps } from '../common/props';
import { deepgramTranscript } from '../common/transcript';

export const createSummaryAction = createAction({
  auth: deepgramAuth,
  name: 'create_summary',
  classification: 'READ',
  displayName: 'Create Summary',
  description: 'Produces a summary of the content from an English audio file.',
  audience: 'human',
  aiMetadata: {
    description:
      'Uploads an audio file to Deepgram and returns an AI-generated summary of its spoken content (summarize v2), synchronously. Pick this over Create Transcription when you need a condensed overview rather than the full text; by default it falls back to the full transcript if no summary is available. Re-running re-processes the audio and incurs another billed request, though it creates no persistent resource. Agents should use deepgram_transcribe_audio with Summarize on.',
    idempotent: false,
  },
  props: {
    audioFile: Property.File({
      displayName: 'Audio File',
      description: 'The English audio or video file to summarize.',
      required: true,
    }),
    model: deepgramProps.sttModel({
      description:
        'Leave empty for nova (Nova-1). For better accuracy choose nova-3-general.',
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      description:
        'Summaries are only available for English (en, en-US, en-GB, en-AU, en-IN, en-NZ). Leave empty for en.',
      options: {
        disabled: false,
        options: LANG_OPTIONS,
      },
    }),
    fallbackToTranscript: Property.Checkbox({
      displayName: 'Fallback to Full Transcript',
      description: 'Return full transcript if summary is not available.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { audioFile, fallbackToTranscript } = context.propsValue;
    const model = context.propsValue.model || 'nova';
    const language = context.propsValue.language || 'en';
    if (!deepgramAudio.isEnglish(language)) {
      throw new Error(
        `Deepgram summaries are only available for English, and the language is set to "${language}". Choose an English language or use Transcribe Audio.`
      );
    }
    const source = deepgramAudio.resolveSource({
      audioUrl: undefined,
      audioFile,
      fallbackContentType: 'audio/wav',
    });
    const body = await deepgramAudio.listen({
      apiKey: context.auth.secret_text,
      source,
      query: { model, summarize: 'v2', language },
      operation: 'summarize the audio',
    });
    const summary = deepgramTranscript.summaryOutcome(body);
    if (summary && summary.result === 'success' && summary.short) {
      return summary;
    }
    const transcript = deepgramTranscript.firstTranscript(body);
    if (fallbackToTranscript && transcript) {
      return transcript;
    }
    const reason = summary?.short ? ` (${summary.short})` : '';
    throw new Error(
      transcript
        ? `Deepgram could not summarize this audio${reason}. Turn on Fallback to Full Transcript to get the transcript instead.`
        : `Deepgram returned no summary or transcript for this audio${reason}.`
    );
  },
});
