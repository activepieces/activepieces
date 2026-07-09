import { createAction } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { props } from '../../generated/lemur-task/props';

export const lemurTask = createAction({
  name: 'lemurTask',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Run a Task using LeMUR',
  description: 'Use the LeMUR task endpoint to input your own LLM prompt.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a custom LLM prompt over one or more existing transcripts using AssemblyAI LeMUR, returning the model-generated response. Use this to summarize, answer questions about, or otherwise reason over transcript content with your own prompt. Requires transcript IDs and a prompt; each call invokes the LLM and produces a new request, so it is not idempotent.',
    idempotent: false,
  },
  props,
  async run(context) {
    const client = getAssemblyAIClient(context);
    const taskResponse = await client.lemur.task({
      transcript_ids: context.propsValue.transcript_ids as string[],
      prompt: context.propsValue.prompt,
    });
    return taskResponse;
  },
});
