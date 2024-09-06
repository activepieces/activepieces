import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../..';
import { ExecutionType, PauseType } from '@activepieces/shared';
import { getAssemblyAIClient } from '../client';

export const transcribe = createAction({
  name: 'transcribe',
  auth: assemblyaiAuth,
  displayName: 'Transcribe',
  description: 'Transcribe an audio or video file using AssemblyAI.',
  props: {
    audio_url: Property.ShortText({
      displayName: 'Audio File URL',
      description: 'The File or URL of the audio or video file.',
      required: true,
    }),
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
    })
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    if (context.executionType === ExecutionType.BEGIN) {
      let callbackUrl: string | undefined = undefined;
      if (context.propsValue.wait_until_ready) {
        callbackUrl = context.generateResumeUrl({
          queryParams: {},
        });
      }
      const transcript = await client.transcripts.submit({
        audio_url: context.propsValue.audio_url,
        webhook_url: callbackUrl
      });
      if (context.propsValue.wait_until_ready) {
        context.run.pause({
          pauseMetadata: {
            type: PauseType.WEBHOOK,
            response: transcript,
          }
        });
      }

      return transcript;
    } else if (context.executionType === ExecutionType.RESUME) {
      const webhookBody = context.resumePayload.body as { transcript_id: string };
      const transcript = await client.transcripts.get(webhookBody.transcript_id);
      if (context.propsValue.throw_on_error && transcript.status === 'error') {
        throw new Error(transcript.error);
      }
      return transcript;
    }
    else {
      throw new Error('Invalid Execution Type');
    }
  },
});
