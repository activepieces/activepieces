import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaSchemas } from '../../common/schemas';
import type { BlockCreateParams } from '../../common/types';

export const lettaCreateBlock = createAction({
  auth: lettaAuth,
  name: 'letta_create_block',
  displayName: 'Create Block',
  description: 'Creates a shared memory block.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.block,
  aiMetadata: {
    description:
      'Creates a standalone Letta memory block (label + value) that can then be attached to one or more agents with Attach Memory Block. Not idempotent: each call creates another block.',
    idempotent: false,
  },
  props: {
    label: Property.ShortText({ displayName: 'Label', description: 'Block label, such as customer_profile.', required: true }),
    value: Property.LongText({ displayName: 'Value', description: 'Initial block text.', required: true }),
    description: Property.ShortText({ displayName: 'Description', description: 'What the block is for; agents read this.', required: false }),
    limit: Property.Number({ displayName: 'Character Limit', description: 'Maximum characters the block may hold.', required: false }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const body: BlockCreateParams = {
      label: lettaApi.requireText({ value: propsValue.label, name: 'Label' }),
      value: propsValue.value,
      description: lettaApi.optionalText(propsValue.description),
      limit: propsValue.limit === undefined || propsValue.limit === null ? undefined : lettaApi.resolveLimit({ limit: propsValue.limit, max: 1000000, fallback: 1 }),
    };
    const block = await lettaApi.callLetta(() => client.blocks.create(body));
    return lettaApi.mapBlock(block);
  },
});
