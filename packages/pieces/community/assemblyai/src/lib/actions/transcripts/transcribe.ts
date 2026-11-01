import {
  ActionContext,
  CreateWaitpointResult,
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { ExecutionType } from '@activepieces/pieces-framework';
import { TranscriptParams } from 'assemblyai';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { props } from '../../generated/transcribe/props';

const transcribeProps = {
  ...props,
  result_info: Property.MarkDown({
    value: 'Waiting cannot be combined with a webhook URL or redacted audio.',
    variant: MarkdownVariant.INFO,
  }),
  wait_until_ready: Property.Checkbox({
    displayName: 'Wait for Transcript',
    description: 'Pause the flow until the transcript is ready.',
    required: true,
    defaultValue: true,
  }),
  throw_on_error: Property.Checkbox({
    displayName: 'Fail on Error',
    description: 'Fail the step if transcription fails.',
    required: true,
    defaultValue: true,
  }),
} as const;
type TranscribeContext = ActionContext<
  typeof assemblyaiAuth,
  typeof transcribeProps
>;
export const transcribe = createAction({
  name: 'transcribe',
  classification: 'WRITE',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Transcribe',
  description: 'Turn an audio or video file into text.',
  audience: 'both',
  aiMetadata: {
    description:
      'Submits an audio or video file (by URL or prior upload) to AssemblyAI for speech-to-text transcription, optionally with extra speech models like speaker diarization, PII redaction, and sentiment. Can either wait synchronously until the transcript is ready or return immediately and continue via webhook (the wait-until-ready and webhook-URL modes are mutually exclusive). Use this to start a new transcription job; each call creates a new transcript, so it is not idempotent.',
    idempotent: false,
  },
  props: transcribeProps,
  propertyGroups: [
    {
      key: 'audio',
      display: 'section',
      label: 'Audio',
      icon: 'file',
      props: ['audio_url', 'audio_start_from', 'audio_end_at'],
    },
    {
      key: 'result',
      display: 'section',
      label: 'Result',
      icon: 'send',
      props: ['result_info', 'wait_until_ready', 'throw_on_error'],
    },
    {
      key: 'language',
      display: 'section',
      label: 'Language',
      icon: 'type',
      props: ['language_code', 'language_detection', 'language_confidence_threshold', 'speech_model'],
    },
    {
      key: 'speakers',
      display: 'section',
      label: 'Speakers',
      icon: 'users',
      props: ['speaker_labels', 'speakers_expected'],
    },
    {
      key: 'privacy',
      display: 'section',
      label: 'Privacy',
      icon: 'filter',
      props: ['redact_pii', 'redact_pii_policies', 'redact_pii_sub', 'redact_pii_audio', 'redact_pii_audio_quality'],
    },
    {
      key: 'summary',
      display: 'section',
      label: 'Summary',
      icon: 'text',
      props: ['summarization', 'summary_model', 'summary_type'],
    },
    {
      key: 'analysis',
      display: 'section',
      label: 'Analysis',
      icon: 'sliders',
      props: [
        'auto_highlights',
        'sentiment_analysis',
        'entity_detection',
        'iab_categories',
        'auto_chapters',
        'content_safety',
        'content_safety_confidence',
        'custom_topics',
        'topics',
      ],
    },
    {
      key: 'vocabulary',
      display: 'section',
      label: 'Vocabulary',
      icon: 'tag',
      props: ['word_boost', 'boost_param', 'custom_spelling'],
    },
  ],
  async run(context: TranscribeContext) {
    const client = getAssemblyAIClient(context);
    if (context.executionType === ExecutionType.BEGIN) {
      const transcriptParams = createTranscriptParams(context);
      const waitpoint = await handleWebhookUrl(context, transcriptParams);
      handlePiiAudio(context);
      handleEmptyArrays(transcriptParams);
      const transcript = await client.transcripts.submit(transcriptParams) as any;
      if (waitpoint) {
        context.run.waitForWaitpoint(waitpoint.id);
      }

      return transcript;
    } else if (context.executionType === ExecutionType.RESUME) {
      const webhookBody = context.resumePayload.body as {
        transcript_id: string;
      };
      const transcript = await client.transcripts.get(
        webhookBody.transcript_id
      );
      if (context.propsValue.throw_on_error && transcript.status === 'error') {
        throw new Error(transcript.error);
      }
      return transcript;
    } else {
      throw new Error('Invalid Execution Type');
    }
  },
});
function createTranscriptParams(context: TranscribeContext): TranscriptParams {
  const transcriptParams: Record<string, unknown> = { ...context.propsValue };
  if ('wait_until_ready' in transcriptParams)
    delete transcriptParams['wait_until_ready'];
  if ('throw_on_error' in transcriptParams)
    delete transcriptParams['throw_on_error'];
  if ('result_info' in transcriptParams)
    delete transcriptParams['result_info'];
  if ('auth' in transcriptParams) delete transcriptParams['auth'];
  return transcriptParams as TranscriptParams;
}
async function handleWebhookUrl(
  context: TranscribeContext,
  transcriptParams: TranscriptParams,
): Promise<CreateWaitpointResult | undefined> {
  if (context.propsValue.wait_until_ready) {
    const isWebhookUrlConfigured = transcriptParams.webhook_url?.trim();
    if (isWebhookUrlConfigured) {
      throw new Error(
        `Wait for Transcript and Webhook URL cannot be used together. Turn off Wait for Transcript to use your own webhook URL.`
      );
    }
    const waitpoint = await context.run.createWaitpoint({
      type: 'WEBHOOK',
    });
    transcriptParams.webhook_url = waitpoint.buildResumeUrl({
      queryParams: {},
    });
    return waitpoint;
  }
  return undefined;
}

function handlePiiAudio(context: TranscribeContext) {
  if (
    context.propsValue.wait_until_ready === true &&
    context.propsValue.redact_pii_audio === true
  ) {
    throw new Error(
      `Wait for Transcript and Redact Audio Too cannot be used together. Turn off Wait for Transcript to get redacted audio.`
    );
  }
}

function handleEmptyArrays(transcriptParams: TranscriptParams) {
  const obj = transcriptParams as Record<string, unknown>;
  for (const key in obj) {
    const value = obj[key];
    if (Array.isArray(value) && value.length === 0) {
      delete obj[key];
    }
  }
}
