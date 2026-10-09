import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { hfUtils } from '../common/utils';
import { listGatedAccessRequestsOutputSchema } from '../output-schemas';

function flattenRequest(entry: unknown) {
  const record = hfHub.isRecord(entry) ? entry : {};
  const user = record['user'];
  const grantedBy = record['grantedBy'];
  const fields = record['fields'];
  return {
    username: hfWrite.readString({ record: user, key: 'user' }),
    user_id: hfWrite.readString({ record: user, key: '_id' }),
    fullname: hfWrite.readString({ record: user, key: 'fullname' }),
    email: hfWrite.readString({ record: user, key: 'email' }),
    status: hfWrite.readString({ record, key: 'status' }),
    requested_at: hfWrite.readString({ record, key: 'timestamp' }),
    reviewed_at: hfWrite.readString({ record, key: 'reviewedAt' }),
    granted_by: hfWrite.readString({ record: grantedBy, key: 'user' }),
    fields: hfHub.isRecord(fields) ? fields : {},
  };
}

export const listGatedAccessRequests = createAction({
  auth: huggingFaceAuth,
  name: 'list_gated_access_requests',
  classification: 'SEARCH',
  displayName: 'List Gated Access Requests',
  description: 'List the access requests of a gated model or dataset by status.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the users who requested access to a gated model or dataset, filtered by status (pending, accepted, rejected or reset) and optionally by requester text or request date, with each requester's username, contact email and the answers to the gate form. Use it to find the username for Accept or Reject Access Request. Page with Requested Before / After using the returned oldest/newest request times. Read-only and safe to retry, but only repository owners or admins can call it (write-role token).",
    idempotent: true,
  },
  outputSchema: listGatedAccessRequestsOutputSchema,
  props: {
    repo_type: Property.StaticDropdown({
      displayName: 'Repository Type',
      description: 'Gated access exists for models and datasets only.',
      required: true,
      defaultValue: 'model',
      options: {
        disabled: false,
        options: [
          { label: 'Model', value: 'model' },
          { label: 'Dataset', value: 'dataset' },
        ],
      },
    }),
    repo_id: hfProps.repoId(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Which requests to list. Defaults to pending.',
      required: true,
      defaultValue: 'pending',
      options: {
        disabled: false,
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Accepted', value: 'accepted' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Reset', value: 'reset' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only requests whose requester username, full name, email, email domain or verified organization matches this text.',
      required: false,
    }),
    after: Property.DateTime({
      displayName: 'Requested After',
      description: 'Only requests made after this date and time (ISO 8601).',
      required: false,
    }),
    before: Property.DateTime({
      displayName: 'Requested Before',
      description: 'Only requests made before this date and time (ISO 8601).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of requests to return (10 to 1000). Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, status, search, after, before, limit } = context.propsValue;
    if (repo_type !== 'model' && repo_type !== 'dataset') {
      throw new Error("Repository Type must be 'model' or 'dataset'; Spaces have no gated access.");
    }
    hfUtils.assertLimit({ value: limit, min: 10, max: 1000, name: 'Limit' });
    const query = hfWrite.optionalText({ value: search, name: 'Search', maxLength: 250 });
    const token = context.auth.secret_text;
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfWrite.request({
      token,
      method: HttpMethod.GET,
      path: `${repo.apiPath}/user-access-request/${encodeURIComponent(status)}`,
      query: [
        ['limit', limit ?? 100],
        ['q', query],
        ['after', after],
        ['before', before],
      ],
    });
    const requests = (Array.isArray(response) ? response : []).map(flattenRequest);
    const times = requests
      .map((request) => request.requested_at)
      .filter((value): value is string => value !== null)
      .sort();
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      status,
      requests,
      count: requests.length,
      oldest_requested_at: times.length > 0 ? times[0] : null,
      newest_requested_at: times.length > 0 ? times[times.length - 1] : null,
    };
  },
});
