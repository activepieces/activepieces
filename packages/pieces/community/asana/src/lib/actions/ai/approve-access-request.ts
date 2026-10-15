import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaAccessRequestDecisionOutputSchema } from '../../output-schemas';

export const asanaApproveAccessRequestAction = createAction({
  auth: asanaAuth,
  name: 'approve_access_request',
  classification: 'WRITE',
  displayName: 'Approve Access Request',
  description: 'Approve a pending request to access an Asana project or portfolio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Approves one pending access request, which gives the requester editor access to the project or portfolio (approving a request made by the connected user themself sets their own membership to editor, so they may lose admin rights such as deleting the project). Only people who can manage the target\'s members can approve. Find request gids with List Access Requests; use Reject Access Request to decline. Not idempotent: a request that was already handled cannot be approved again.',
    idempotent: false,
  },
  outputSchema: asanaAccessRequestDecisionOutputSchema,
  props: {
    access_request: Property.ShortText({
      displayName: 'Access Request GID',
      description: 'Gid of the pending access request. Obtain it from List Access Requests.',
      required: true,
    }),
  },
  async run(context) {
    const accessRequest = context.propsValue.access_request.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/access_requests/${asanaUtils.pathSegment(accessRequest)}/approve`,
      operation: 'Approve Access Request',
      data: {},
    });
    return { success: true, access_request_gid: accessRequest, approval_status: 'approved' };
  },
});
