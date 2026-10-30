import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { LemonSqueezyApiError, lsRequest, numericId, seg } from '../common/client';


export const deleteDiscount = createAction({
  auth: lemonSqueezyAuth,
  name: 'delete_discount',
  displayName: 'Delete Discount',
  description: 'Permanently delete a discount code.',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Lemon Squeezy discount by numeric discount ID; customers can no longer use the code. Past orders keep their discount. Idempotent: deleting a discount that is already gone returns already_deleted=true.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'id', label: 'Discount ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'already_deleted', label: 'Already Deleted', format: 'boolean' },
    ],
  },
  props: {
    discountId: Property.ShortText({
      displayName: 'Discount ID',
      description: 'The numeric ID of the discount (not the code).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const id = numericId({ value: propsValue.discountId, label: 'Discount ID' });
    try {
      await lsRequest({ apiKey: auth.secret_text, method: 'DELETE', path: `/discounts/${seg({ value: id, label: 'Discount ID' })}` });
      return { id, deleted: true, already_deleted: false };
    } catch (error) {
      if (error instanceof LemonSqueezyApiError && error.status === 404) {
        return { id, deleted: true, already_deleted: true };
      }
      throw error;
    }
  },
});
