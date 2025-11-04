import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../../index';
import { makeRequest } from '../common';

export const createMemAction = createAction({
  auth: memAuth,
  name: 'create_mem',
  displayName: 'Create Mem',
  description: 'Save any content to Mem.ai for intelligent processing and future reference.',
  props: {
    input: Property.LongText({
      displayName: 'Input',
      required: true,
      description: 'Raw content you want to remember - HTML, emails, transcripts, or simple notes.',
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      required: false,
      description: 'Optional guidance on how you want this content processed or remembered.',
    }),
    context: Property.LongText({
      displayName: 'Context',
      required: false,
      description: 'Additional background information to relate this to your existing knowledge.',
    }),
  },
  async run(context) {
    const { input, instructions, context: contextInfo } = context.propsValue;
    const apiKey = context.auth as string;

    const body = {
      input,
      ...(instructions ? { instructions } : {}),
      ...(contextInfo ? { context: contextInfo } : {}),
    };

    const result = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/mem-it`,
      body
    );

    return result;
  },
});
