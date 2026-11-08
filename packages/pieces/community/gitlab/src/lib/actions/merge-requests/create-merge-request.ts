import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  gitlabProps,
  idList,
  optionalPositiveInt,
  optionalText,
  requireText,
  stringList,
  triStateValue,
} from '../../common/props';
import { mergeRequestOutputSchema } from '../../output-schemas';

export const createMergeRequestAction = createAction({
  auth: gitlabAuth,
  name: 'create_merge_request',
  displayName: 'Create Merge Request',
  description:
    'Opens a merge request from a source branch into a target branch.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Opens a GitLab merge request from a source branch into a target branch, with optional description, labels, assignees, reviewers and milestone. GitLab refuses a second open merge request for the same branch pair, so a retry fails with a conflict rather than duplicating.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    sourceBranch: gitlabProps.branch(
      'Source Branch',
      'Branch with the changes.'
    ),
    targetBranch: gitlabProps.branch(
      'Target Branch',
      'Branch to merge into, e.g. main.'
    ),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Prefix with "Draft:" to open it as a draft.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    labels: Property.Array({ displayName: 'Labels', required: false }),
    assigneeIds: Property.Array({
      displayName: 'Assignee User IDs',
      required: false,
    }),
    reviewerIds: Property.Array({
      displayName: 'Reviewer User IDs',
      required: false,
    }),
    milestoneId: Property.Number({
      displayName: 'Milestone ID',
      description: 'Global milestone ID (not the iid).',
      required: false,
    }),
    removeSourceBranch: gitlabProps.triState(
      'Delete Source Branch on Merge',
      'Leave empty to use the project default.'
    ),
    squash: gitlabProps.triState(
      'Squash Commits on Merge',
      'Leave empty to use the project default.'
    ),
  },
  outputSchema: mergeRequestOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/merge_requests`,
      body: {
        source_branch: requireText({
          value: propsValue.sourceBranch,
          label: 'Source Branch',
        }),
        target_branch: requireText({
          value: propsValue.targetBranch,
          label: 'Target Branch',
        }),
        title: requireText({ value: propsValue.title, label: 'Title' }),
        description: optionalText(propsValue.description),
        labels: stringList({ value: propsValue.labels, label: 'Labels' })?.join(
          ','
        ),
        assignee_ids: idList({
          value: propsValue.assigneeIds,
          label: 'Assignee User IDs',
        }),
        reviewer_ids: idList({
          value: propsValue.reviewerIds,
          label: 'Reviewer User IDs',
        }),
        milestone_id: optionalPositiveInt({
          value: propsValue.milestoneId,
          label: 'Milestone ID',
        }),
        remove_source_branch: triStateValue(propsValue.removeSourceBranch),
        squash: triStateValue(propsValue.squash),
      },
      statusMessages: {
        409: 'An open merge request already exists for this source and target branch',
      },
    });
  },
});
