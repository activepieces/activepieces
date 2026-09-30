import { createAction, Property } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { claudeAuth } from '../auth';
import { createMessageBatchActionOutputSchema } from '../output-schemas';

export const createMessageBatchAction = createAction({
  audience: 'ai',
  auth: claudeAuth,
  name: 'create_message_batch',
  classification: 'WRITE',
  displayName: 'Create Message Batch',
  description: 'Submits a batch of Messages API requests to be processed asynchronously, at up to 24 hours turnaround.',
  aiMetadata: {
    description:
      "Submits multiple Messages API requests as a single asynchronous batch (up to 24h to complete), cheaper than calling Ask Claude repeatedly for large volumes. Each request needs a unique custom_id and a params object shaped like the Messages API (model, messages, max_tokens, system). Poll status with Get Message Batch and read output with Get Message Batch Results once processing_status is 'ended'. Not idempotent: each call creates a new batch.",
    idempotent: false,
  },
  props: {
    requests: Property.Json({
      displayName: 'Requests',
      description:
        'Array of { custom_id, params } objects. Each custom_id must be unique within the batch; each params object matches the Messages API request body (model, messages, max_tokens, system, etc).',
      required: true,
      defaultValue: [
        {
          custom_id: 'request-1',
          params: {
            model: 'claude-3-5-haiku-latest',
            max_tokens: 1024,
            messages: [{ role: 'user', content: 'Hello, Claude!' }],
          },
        },
      ],
    }),
  },
  outputSchema: createMessageBatchActionOutputSchema,
  async run(context) {
    const anthropic = new Anthropic({ apiKey: context.auth.secret_text });
    return anthropic.messages.batches.create({
      requests: context.propsValue
        .requests as unknown as Anthropic.Messages.BatchCreateParams['requests'],
    });
  },
});
