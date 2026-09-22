import { createAction, Property } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { claudeAuth } from '../auth';
import { getMessageBatchResultsActionOutputSchema } from '../output-schemas';

const DEFAULT_MAX_RESULTS = 100;

export const getMessageBatchResultsAction = createAction({
  audience: 'ai',
  auth: claudeAuth,
  name: 'get_message_batch_results',
  classification: 'READ',
  displayName: 'Get Message Batch Results',
  description: 'Reads the per-request results of a finished message batch.',
  aiMetadata: {
    description:
      "Reads the results of a message batch once Get Message Batch reports processing_status 'ended', returning each request's custom_id alongside its outcome ('succeeded' with the Message, or 'errored'/'canceled'/'expired'). Results are not guaranteed to be in request order; match on custom_id. Idempotent: it only reads data.",
    idempotent: true,
  },
  props: {
    messageBatchId: Property.ShortText({
      displayName: 'Message Batch ID',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: `Maximum number of results to return (default ${DEFAULT_MAX_RESULTS}).`,
      required: false,
    }),
  },
  outputSchema: getMessageBatchResultsActionOutputSchema,
  async run(context) {
    const anthropic = new Anthropic({ apiKey: context.auth.secret_text });
    const maxResults = context.propsValue.maxResults ?? DEFAULT_MAX_RESULTS;
    const decoder = await anthropic.messages.batches.results(context.propsValue.messageBatchId);

    const results = [];
    for await (const result of decoder) {
      results.push(result);
      if (results.length >= maxResults) {
        break;
      }
    }
    return { results };
  },
});
