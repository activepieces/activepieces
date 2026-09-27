import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteAllocationOutputSchema } from '../../output-schemas';

export const asanaDeleteAllocationAction = createAction({
  auth: asanaAuth,
  name: 'delete_allocation',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Allocation',
  description: 'Delete an Asana resource-management allocation (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one allocation, freeing that person\'s booked time on the project; the project and the user are not affected. To shorten or reassign a booking instead, use Update Allocation. Allocations need an Advanced or higher Asana plan. Irreversible; repeating the call on the same allocation fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteAllocationOutputSchema,
  props: {
    allocation: Property.ShortText({
      displayName: 'Allocation GID',
      description: 'Gid of the allocation to delete. Obtain it from List Allocations.',
      required: true,
    }),
  },
  async run(context) {
    const allocation = context.propsValue.allocation.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/allocations/${asanaUtils.pathSegment(allocation)}`,
      operation: 'Delete Allocation',
    });
    return { success: true, allocation_gid: allocation };
  },
});
