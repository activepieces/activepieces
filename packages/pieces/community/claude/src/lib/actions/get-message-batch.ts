import { createAction, Property } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { claudeAuth } from '../auth';
import { getMessageBatchActionOutputSchema } from '../output-schemas';

export const getMessageBatchAction = createAction({
  audience: 'ai',
  auth: claudeAuth,
  name: 'get_message_batch',
  classification: 'READ',
  displayName: 'Get Message Batch',
  description: 'Reads the status and request counts of a message batch, to poll for completion.',
  aiMetadata: {
    description:
      "Reads a message batch by ID, returning its processing_status ('in_progress', 'canceling', or 'ended') and a tally of succeeded/errored/canceled/expired requests. Poll this after Create Message Batch until processing_status is 'ended', then call Get Message Batch Results. Idempotent: it only reads data.",
    idempotent: true,
  },
  props: {
    messageBatchId: Property.ShortText({
      displayName: 'Message Batch ID',
      required: true,
    }),
  },
  outputSchema: getMessageBatchActionOutputSchema,
  async run(context) {
    const anthropic = new Anthropic({ apiKey: context.auth.secret_text });
    return anthropic.messages.batches.retrieve(context.propsValue.messageBatchId);
  },
});
