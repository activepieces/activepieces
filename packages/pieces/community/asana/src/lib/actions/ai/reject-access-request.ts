import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaAccessRequestDecisionOutputSchema } from '../../output-schemas';

export const asanaRejectAccessRequestAction = createAction({
  auth: asanaAuth,
  name: 'reject_access_request',
  classification: 'WRITE',
  displayName: 'Reject Access Request',
  description: 'Decline a pending request to access an Asana project or portfolio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rejects one pending access request; the requester does not get access and can ask again later. Only people who can manage the target\'s members can reject. Find request gids with List Access Requests; use Approve Access Request to grant access instead. Not idempotent: a request that was already handled cannot be rejected again.',
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
      path: `/access_requests/${asanaUtils.pathSegment(accessRequest)}/reject`,
      operation: 'Reject Access Request',
      data: {},
    });
    return { success: true, access_request_gid: accessRequest, approval_status: 'rejected' };
  },
});
