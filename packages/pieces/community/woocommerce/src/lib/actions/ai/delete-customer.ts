import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { deleteCustomerOutputSchema } from '../../output-schemas';

export const wooAiDeleteCustomer = createAction({
  name: 'delete_customer',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Customer',
  description: 'Permanently delete a customer account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one customer account (its WordPress user); customers have no trash, so it cannot be restored. Only accounts with the customer or subscriber role can be deleted here, so staff and administrators are refused. Their orders stay in the store; optionally reassign their posts to another user id.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: deleteCustomerOutputSchema,
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Id of the customer to delete. Find it with list_customers.',
      required: true,
    }),
    reassign_to_user_id: Property.Number({
      displayName: 'Reassign To User ID',
      description: 'Optional id of another user who takes over the posts owned by the deleted customer. Must differ from the customer id.',
      required: false,
    }),
  },
  async run(context) {
    const { customer_id, reassign_to_user_id } = context.propsValue;
    const auth = context.auth.props;
    const hasReassign = reassign_to_user_id !== undefined && reassign_to_user_id !== null;
    if (hasReassign && String(reassign_to_user_id) === String(customer_id)) {
      throw new Error('Reassign To User ID must be a different user than the customer being deleted.');
    }
    const customer = await wooClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/customers/${wooClient.encodeId(customer_id)}`,
    });
    const role = readRole(customer);
    if (role === undefined || !deletableRoles.includes(role)) {
      throw new Error(
        `Refusing to delete user ${customer_id}: their role is "${role ?? 'unknown'}". Only accounts with the customer or subscriber role can be deleted with this action.`
      );
    }
    return wooClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/customers/${wooClient.encodeId(customer_id)}`,
      queryParams: {
        force: true,
        reassign: hasReassign ? reassign_to_user_id : undefined,
      },
    });
  },
});

function readRole(customer: unknown): string | undefined {
  if (typeof customer !== 'object' || customer === null) {
    return undefined;
  }
  const record: Record<string, unknown> = Object(customer);
  const role = record['role'];
  return typeof role === 'string' ? role : undefined;
}

const deletableRoles = ['customer', 'subscriber'];
