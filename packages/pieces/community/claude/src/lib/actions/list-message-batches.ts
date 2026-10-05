import { createAction, Property } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { claudeAuth } from '../auth';
import { listMessageBatchesActionOutputSchema } from '../output-schemas';

export const listMessageBatchesAction = createAction({
  audience: 'ai',
  auth: claudeAuth,
  name: 'list_message_batches',
  classification: 'SEARCH',
  displayName: 'List Message Batches',
  description: 'Lists message batches, most recently created first.',
  aiMetadata: {
    description:
      'Lists message batches in the workspace, most recently created first, returning each batch\'s ID and processing_status. Use to discover a batch ID before calling Get Message Batch, Get Message Batch Results, Cancel Message Batch, or Delete Message Batch. Idempotent: it only reads data.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of batches to return per page (default 20, max 1000).',
      required: false,
    }),
    afterId: Property.ShortText({
      displayName: 'After ID',
      description: 'Return the page of batches immediately after this batch ID.',
      required: false,
    }),
    beforeId: Property.ShortText({
      displayName: 'Before ID',
      description: 'Return the page of batches immediately before this batch ID.',
      required: false,
    }),
  },
  outputSchema: listMessageBatchesActionOutputSchema,
  async run(context) {
    const anthropic = new Anthropic({ apiKey: context.auth.secret_text });
    const page = await anthropic.messages.batches.list({
      limit: context.propsValue.limit,
      after_id: context.propsValue.afterId,
      before_id: context.propsValue.beforeId,
    });
    return {
      data: page.data,
      has_more: page.has_more,
      first_id: page.first_id,
      last_id: page.last_id,
    };
  },
});
