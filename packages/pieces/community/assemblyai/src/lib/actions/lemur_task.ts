import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../..';
import { getAssemblyAIClient } from '../client';

export const lemurTask = createAction({
  name: 'lemur_task',
  auth: assemblyaiAuth,
  displayName: 'Run a Task using LeMUR',
  description: 'Use the LeMUR task endpoint to input your own LLM prompt.',
  props: {
    transcript_ids: Property.Array({
      displayName: 'Transcript IDs',
      required: true,
      properties: {
        id: Property.ShortText({
          displayName: 'ID',
          required: true,
        })
      }
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const taskResponse = await client.lemur.task({
      transcript_ids: (context.propsValue.transcript_ids as { id: string }[]).map((transcript) => transcript.id),
      prompt: context.propsValue.prompt,
    });
    return taskResponse;
  },
});
