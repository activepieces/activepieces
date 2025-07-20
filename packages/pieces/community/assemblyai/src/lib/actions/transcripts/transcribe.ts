import {
  ActionContext,
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';
import { TranscriptParams } from 'assemblyai';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { props } from '../../generated/transcribe/props';

const transcribeProps = {
  ...props,
  wait_until_ready: Property.Checkbox({
    displayName: 'Wait until transcript is ready',
    description: `Wait until the transcript status is "completed" or "error" before moving on to the next step.`,
    required: true,
    defaultValue: true,
  }),
  throw_on_error: Property.Checkbox({
    displayName: 'Throw if transcript status is error',
    description: `If the transcript status is "error", throw an error.`,
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
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Transcribe',
  description: 'Transcribe an audio or video file using AssemblyAI.',
  props: transcribeProps,
  async run(context: TranscribeContext) {
    const client = getAssemblyAIClient(context);
    if (context.executionType === ExecutionType.BEGIN) {
      const transcriptParams = createTranscriptParams(context);
      handleWebhookUrl(context, transcriptParams);
      handlePiiAudio(context);
      handleEmptyArrays(transcriptParams);
      const transcript = await client.transcripts.submit(transcriptParams) as any;
      if (context.propsValue.wait_until_ready) {
        context.run.pause({
          pauseMetadata: {
            type: PauseType.WEBHOOK,
            response: transcript,
          },
        });
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
  if ('auth' in transcriptParams) delete transcriptParams['auth'];
  return transcriptParams as TranscriptParams;
}
function handleWebhookUrl(
  context: TranscribeContext,
  transcriptParams: TranscriptParams
) {
  if (context.propsValue.wait_until_ready) {
    const isWebhookUrlConfigured = transcriptParams.webhook_url?.trim();
    if (isWebhookUrlConfigured) {
      throw new Error(
        `The "Wait until transcript is ready" and "Webhook URL" fields are mutually exclusive. Please remove the "Webhook URL" field to use the "Wait until transcript is ready" field.`
      );
    }
    transcriptParams.webhook_url = context.generateResumeUrl({
      queryParams: {},
    });
  }
}

function handlePiiAudio(context: TranscribeContext) {
  if (
    context.propsValue.wait_until_ready === true &&
    context.propsValue.redact_pii_audio === true
  ) {
    throw new Error(
      `The "Wait until transcript is ready" and "Redact PII audio" fields are mutually exclusive. Set the "Wait until transcript is ready" or "Redact PII audio" to false.`
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
