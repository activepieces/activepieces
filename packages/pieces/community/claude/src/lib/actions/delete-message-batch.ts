import { createAction, Property } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { claudeAuth } from '../auth';
import { deleteMessageBatchActionOutputSchema } from '../output-schemas';

export const deleteMessageBatchAction = createAction({
  audience: 'ai',
  auth: claudeAuth,
  name: 'delete_message_batch',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Message Batch',
  description: 'Deletes a message batch and its results. The batch must have finished processing first.',
  aiMetadata: {
    description:
      "Permanently deletes a message batch, once its processing_status is 'ended' (an in-progress batch must be canceled first via Cancel Message Batch). This removes access to the batch's results. Not idempotent: deleting an already-deleted batch fails with not_found.",
    idempotent: false,
  },
  props: {
    messageBatchId: Property.ShortText({
      displayName: 'Message Batch ID',
      required: true,
    }),
  },
  outputSchema: deleteMessageBatchActionOutputSchema,
  async run(context) {
    const anthropic = new Anthropic({ apiKey: context.auth.secret_text });
    return anthropic.messages.batches.delete(context.propsValue.messageBatchId);
  },
});
