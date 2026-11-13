import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  gitlabProps,
  requirePositiveInt,
  requireText,
} from '../../common/props';
import { draftNoteOutputSchema } from '../../output-schemas';

export const createMergeRequestDraftNoteAction = createAction({
  auth: gitlabAuth,
  name: 'create_merge_request_draft_note',
  displayName: 'Create Merge Request Draft Comment',
  description: 'Adds an unpublished review comment to a merge request.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a draft (unpublished, pending review) comment to a GitLab merge request; it is visible only to its author until the review is submitted in GitLab. Not idempotent: each call adds another draft.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
    note: Property.LongText({ displayName: 'Comment', required: true }),
  },
  outputSchema: draftNoteOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(
        propsValue.projectId
      )}/merge_requests/${iid}/draft_notes`,
      body: { note: requireText({ value: propsValue.note, label: 'Comment' }) },
    });
  },
});
