import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaAccessRequestListOutputSchema } from '../../output-schemas';

export const asanaListAccessRequestsAction = createAction({
  auth: asanaAuth,
  name: 'list_access_requests',
  classification: 'SEARCH',
  displayName: 'List Access Requests',
  description: 'List pending requests to access a private Asana project or portfolio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the pending access requests on one project or portfolio, optionally from one requester, with each request\'s message and status. Use the returned gids with Approve Access Request or Reject Access Request. Returns every pending request in one response (Asana does not paginate this list). Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaAccessRequestListOutputSchema,
  props: {
    target: Property.ShortText({
      displayName: 'Project or Portfolio GID',
      description: 'Gid of the project or portfolio whose access requests to list. Obtain a project gid from List Projects.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'Requester',
      description: 'Only return requests from this user: "me", an email address or a user gid. Leave empty for all requesters.',
      required: false,
    }),
  },
  async run(context) {
    const { target, user } = context.propsValue;
    const data = await asanaClient.asanaData<AsanaRecord[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/access_requests',
      operation: 'List Access Requests',
      query: {
        target: target.trim(),
        user: asanaUtils.hasValue(user) ? String(user).trim() : undefined,
        opt_fields: ASANA_FIELDS.accessRequest,
      },
    });
    return { data: Array.isArray(data) ? data : [] };
  },
});
