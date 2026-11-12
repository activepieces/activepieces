import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';

export const createMemAction = createAction({
  auth: memAuth,
  name: 'create_mem',
  classification: 'WRITE',
  displayName: 'Create Mem',
  description: 'Send raw content to Mem so it can process and file it for you. Returns only a request ID; the note appears in Mem a few seconds later.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends raw content (HTML, emails, transcripts, or plain notes) to Mem\'s asynchronous "mem-it" endpoint, which processes and files it into the knowledge base; optionally accepts processing instructions, background context and a timestamp. Returns only request_id because processing is asynchronous; the resulting note appears in Mem a few seconds later and cannot be read from this step output. Use to capture unstructured material and let Mem decide how to organize it; use Create Note to write a specific note. Not idempotent: each call ingests the content again.',
    idempotent: false,
  },
  props: {
    input: Property.LongText({
      displayName: 'Input',
      required: true,
      description: 'Raw content to remember, such as HTML, an email, a transcript or a simple note.',
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      required: false,
      description: 'Optional guidance on how Mem should process or remember this content.',
    }),
    context: Property.LongText({
      displayName: 'Context',
      required: false,
      description: 'Additional background that relates this content to your existing knowledge.',
    }),
    timestamp: Property.DateTime({
      displayName: 'Timestamp',
      required: false,
      description: 'When the content was captured. Defaults to now.',
    }),
  },
  outputSchema: memSchemas.memIt,
  async run(context) {
    const { input, instructions, context: contextInfo, timestamp } = context.propsValue;
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/mem-it',
      body: {
        input,
        ...(instructions ? { instructions } : {}),
        ...(contextInfo ? { context: contextInfo } : {}),
        ...(timestamp ? { timestamp } : {}),
      },
    });
  },
});
