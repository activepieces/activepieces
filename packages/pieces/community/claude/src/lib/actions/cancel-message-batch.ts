import { createAction, Property } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { claudeAuth } from '../auth';
import { cancelMessageBatchActionOutputSchema } from '../output-schemas';

export const cancelMessageBatchAction = createAction({
  audience: 'ai',
  auth: claudeAuth,
  name: 'cancel_message_batch',
  classification: 'WRITE',
  displayName: 'Cancel Message Batch',
  description: 'Cancels an in-progress message batch. Already-completed requests in the batch are not undone.',
  aiMetadata: {
    description:
      "Cancels a message batch that is still 'in_progress'. The batch moves to 'canceling' and the system finishes any non-interruptible requests already underway before finalizing; check request_counts.canceled via Get Message Batch to see how many were actually stopped. Idempotent: canceling an already-canceling or ended batch has no further effect.",
    idempotent: true,
  },
  props: {
    messageBatchId: Property.ShortText({
      displayName: 'Message Batch ID',
      required: true,
    }),
  },
  outputSchema: cancelMessageBatchActionOutputSchema,
  async run(context) {
    const anthropic = new Anthropic({ apiKey: context.auth.secret_text });
    return anthropic.messages.batches.cancel(context.propsValue.messageBatchId);
  },
});
