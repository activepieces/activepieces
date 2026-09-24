import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';

export const handleGatedAccessRequest = createAction({
  auth: huggingFaceAuth,
  name: 'handle_gated_access_request',
  classification: 'WRITE',
  displayName: 'Accept or Reject Access Request',
  description: "Accept, reject, reset or re-queue a user's access request to a gated model or dataset.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Sets the status of one user's access request to a gated model or dataset: accepted (grants that person access to the gated files), rejected, pending, or reset. Only accept when the user explicitly approves that requester. Find requesters with List Gated Access Requests. Setting the same status again converges, so it is safe to retry. Requires a write-role token with owner or admin rights on the repository.",
    idempotent: true,
  },
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
    username: Property.ShortText({
      displayName: 'Username',
      description: "The Hub username of the requester, for example 'julien-c' (the 'username' from List Gated Access Requests).",
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'New Status',
      description: 'Accepted grants access; Rejected refuses it; Pending moves it back to the queue; Reset clears it so the user must request again.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Accepted', value: 'accepted' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Pending', value: 'pending' },
          { label: 'Reset', value: 'reset' },
        ],
      },
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Optional reason shown to the requester, up to 200 characters. Only used with Rejected or Reset.',
      required: false,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, username, status, reason } = context.propsValue;
    if (repo_type !== 'model' && repo_type !== 'dataset') {
      throw new Error("Repository Type must be 'model' or 'dataset'; Spaces have no gated access.");
    }
    if (status !== 'accepted' && status !== 'rejected' && status !== 'pending' && status !== 'reset') {
      throw new Error("New Status must be 'accepted', 'rejected', 'pending' or 'reset'.");
    }
    const user = hfWrite.requireText({ value: username, name: 'Username' });
    const reasonText = hfWrite.optionalText({ value: reason, name: 'Reason', maxLength: 200 });
    if (reasonText !== undefined && status !== 'rejected' && status !== 'reset') {
      throw new Error('Reason can only be set when New Status is Rejected or Reset.');
    }
    const token = context.auth.secret_text;
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const body: Record<string, unknown> = { user, status };
    if (reasonText !== undefined) {
      body[status === 'rejected' ? 'rejectionReason' : 'resetReason'] = reasonText;
    }
    await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${repo.apiPath}/user-access-request/handle`,
      body,
    });
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      username: user,
      status,
      reason: reasonText ?? null,
    };
  },
});
