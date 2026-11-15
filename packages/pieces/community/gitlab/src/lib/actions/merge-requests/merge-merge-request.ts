import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { mergeMergeRequest } from '../../common/irreversible';
import {
  gitlabProps,
  optionalText,
  requirePositiveInt,
  triStateValue,
} from '../../common/props';
import { mergeRequestOutputSchema } from '../../output-schemas';

export const mergeMergeRequestAction = createAction({
  auth: gitlabAuth,
  name: 'merge_merge_request',
  displayName: 'Merge Merge Request',
  description: 'Merges a merge request into its target branch.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Merges a GitLab merge request into its target branch, optionally squashing and deleting the source branch; this changes the target branch and cannot be undone through the API. Pass the expected head SHA to refuse the merge if new commits were pushed. With Auto Merge, GitLab merges once the pipeline succeeds instead of now.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
    sha: Property.ShortText({
      displayName: 'Expected Head SHA',
      description:
        'If set, the merge fails when the source branch head is not this SHA.',
      required: false,
    }),
    squash: gitlabProps.triState(
      'Squash Commits',
      'Leave empty to use the merge request setting.'
    ),
    shouldRemoveSourceBranch: gitlabProps.triState(
      'Delete Source Branch',
      'Leave empty to use the merge request setting.'
    ),
    mergeCommitMessage: Property.LongText({
      displayName: 'Merge Commit Message',
      required: false,
    }),
    squashCommitMessage: Property.LongText({
      displayName: 'Squash Commit Message',
      required: false,
    }),
    autoMerge: gitlabProps.triState(
      'Auto Merge',
      'Merge when the pipeline succeeds instead of immediately.'
    ),
  },
  outputSchema: mergeRequestOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    return mergeMergeRequest({
      auth,
      projectId: propsValue.projectId,
      mergeRequestIid: iid,
      body: {
        sha: optionalText(propsValue.sha),
        squash: triStateValue(propsValue.squash),
        should_remove_source_branch: triStateValue(
          propsValue.shouldRemoveSourceBranch
        ),
        merge_commit_message: optionalText(propsValue.mergeCommitMessage),
        squash_commit_message: optionalText(propsValue.squashCommitMessage),
        auto_merge: triStateValue(propsValue.autoMerge),
      },
      statusMessages: {
        401: 'The connected user is not allowed to merge this merge request',
        405: 'The merge request cannot be merged now (draft, closed, already merged, conflicts or blocked by required approvals or pipelines)',
        406: 'The merge request has conflicts and cannot be merged',
        409: 'The source branch head does not match the expected SHA',
        422: 'GitLab could not merge the merge request',
      },
    });
  },
});
