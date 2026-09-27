import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaGetAllocationAction = createAction({
  auth: asanaAuth,
  name: 'get_allocation',
  classification: 'READ',
  displayName: 'Get Allocation',
  description: 'Get one Asana resource-management allocation (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one allocation: the assignee, the project, start and end dates, effort (hours or percent) and who created it. Allocations need an Advanced or higher Asana plan with resource management. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    allocation: Property.ShortText({
      displayName: 'Allocation GID',
      description: 'Gid of the allocation. Obtain it from List Allocations.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/allocations/${asanaUtils.pathSegment(context.propsValue.allocation)}`,
      operation: 'Get Allocation',
      query: { opt_fields: ASANA_FIELDS.allocation },
    });
  },
});
