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
