import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAudio } from '../common/audio';
import { deepgramAuth } from '../common/auth';
import { deepgramClient } from '../common/client';
import { LANG_OPTIONS } from '../common/constants';
import { deepgramProps } from '../common/props';
import { createTranscriptionCallbackOutputSchema } from '../output-schemas';

export const createTranscriptionCallbackAction = createAction({
  auth: deepgramAuth,
  name: 'create_transcription_callback',
  classification: 'WRITE',
  displayName: 'Create Transcription (Callback)',
  description:
    'Starts a transcription and has Deepgram send the result to a callback URL. To receive it in another flow, use the Catch Webhook URL of the Webhook piece.',
  audience: 'human',
  aiMetadata: {
    description:
      'Submits an audio file to Deepgram for asynchronous speech-to-text: the action returns only a request ID immediately, and the finished transcript is delivered later to the callback URL you provide. Pick this for long audio or when a webhook endpoint will consume the result; it does not return the transcript itself. Each run submits a new billed transcription job, so it is not idempotent. Agents should use deepgram_transcribe_audio.',
    idempotent: false,
  },
  outputSchema: createTranscriptionCallbackOutputSchema,
  props: {
    audioFile: Property.File({
      displayName: 'Audio File',
      description:
        'The audio or video file to transcribe. Use this or Audio URL.',
      required: false,
    }),
    audioUrl: Property.ShortText({
      displayName: 'Audio URL',
      description:
        'A public link to the audio or video file. Deepgram downloads it directly. Use this or Audio File.',
      required: false,
    }),
    model: deepgramProps.sttModel({
      description:
        'Leave empty for nova (Nova-1, English, Spanish and Hindi only). For other languages choose nova-3-general or nova-2-general.',
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      description:
        'Spoken language. Leave empty for en. The default model nova only supports en, es and hi-Latn; pick a nova-3 or nova-2 model for other languages.',
      options: {
        disabled: false,
        options: LANG_OPTIONS,
      },
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      description:
        'URL to receive the transcription when ready. Must use port 80, 443, 8080 or 8443. Basic-auth credentials (https://user:password@host) are allowed and hidden in the output.',
      required: true,
    }),
    callbackMethod: Property.StaticDropdown({
      displayName: 'Callback Method',
      description: 'How Deepgram sends the result. Defaults to POST.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
        ],
      },
    }),
    smartFormat: Property.Checkbox({
      displayName: 'Smart Format',
      description:
        'Add punctuation, capitals and readable numbers, dates and currency.',
      required: false,
      defaultValue: false,
    }),
    diarize: Property.Checkbox({
      displayName: 'Identify Speakers',
      description: 'Label who speaks when.',
      required: false,
      defaultValue: false,
    }),
    paragraphs: Property.Checkbox({
      displayName: 'Paragraphs',
      required: false,
      defaultValue: false,
    }),
    utterances: Property.Checkbox({
      displayName: 'Utterances',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const model = props.model || 'nova';
    const language = props.language || 'en';
    const callbackUrl = deepgramAudio.checkCallbackUrl(props.callbackUrl);
    const callbackMethod = props.callbackMethod ?? undefined;
    if (
      callbackMethod &&
      callbackMethod !== 'POST' &&
      callbackMethod !== 'PUT'
    ) {
      throw new Error('Callback Method must be POST or PUT.');
    }
    const source = deepgramAudio.resolveSource({
      audioUrl: props.audioUrl,
      audioFile: props.audioFile,
      fallbackContentType: 'audio/wav',
    });
    const body = await deepgramAudio.listen({
      apiKey: context.auth.secret_text,
      source,
      query: {
        model,
        callback: callbackUrl,
        callback_method: callbackMethod?.toLowerCase(),
        language,
        smart_format: props.smartFormat === true ? 'true' : undefined,
        diarize_model: props.diarize === true ? 'latest' : undefined,
        paragraphs: props.paragraphs === true ? 'true' : undefined,
        utterances: props.utterances === true ? 'true' : undefined,
      },
      operation: 'start the transcription',
    });
    return {
      requestId: body.request_id ?? body.metadata?.request_id ?? null,
      callbackUrl: deepgramClient.maskUrlCredentials(callbackUrl),
      status: 'submitted',
    };
  },
});
