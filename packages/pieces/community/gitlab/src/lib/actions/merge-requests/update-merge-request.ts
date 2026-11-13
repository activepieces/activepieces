import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  gitlabProps,
  idList,
  optionalPositiveInt,
  optionalText,
  requirePositiveInt,
  stringList,
  triStateValue,
} from '../../common/props';
import { mergeRequestOutputSchema } from '../../output-schemas';

export const updateMergeRequestAction = createAction({
  auth: gitlabAuth,
  name: 'update_merge_request',
  displayName: 'Update Merge Request',
  description:
    'Updates the fields of a merge request. Fields left empty are not changed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes an open GitLab merge request: title, description, target branch, close or reopen, add or remove labels, assignees, reviewers, milestone, squash and delete-source-branch settings. Only the fields you set are sent; use the Clear options to blank a field. Use Merge Merge Request to merge it.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    clearDescription: Property.Checkbox({
      displayName: 'Clear Description',
      required: false,
      defaultValue: false,
    }),
    targetBranch: Property.ShortText({
      displayName: 'Target Branch',
      required: false,
    }),
    stateEvent: Property.StaticDropdown({
      displayName: 'State Change',
      required: false,
      options: {
        options: [
          { label: 'Close', value: 'close' },
          { label: 'Reopen', value: 'reopen' },
        ],
      },
    }),
    addLabels: Property.Array({ displayName: 'Add Labels', required: false }),
    removeLabels: Property.Array({
      displayName: 'Remove Labels',
      required: false,
    }),
    assigneeIds: Property.Array({
      displayName: 'Assignee User IDs',
      description: 'Replaces the current assignees.',
      required: false,
    }),
    clearAssignees: Property.Checkbox({
      displayName: 'Remove All Assignees',
      required: false,
      defaultValue: false,
    }),
    reviewerIds: Property.Array({
      displayName: 'Reviewer User IDs',
      description: 'Replaces the current reviewers.',
      required: false,
    }),
    clearReviewers: Property.Checkbox({
      displayName: 'Remove All Reviewers',
      required: false,
      defaultValue: false,
    }),
    milestoneId: Property.Number({
      displayName: 'Milestone ID',
      description: 'Global milestone ID (not the iid).',
      required: false,
    }),
    clearMilestone: Property.Checkbox({
      displayName: 'Remove Milestone',
      required: false,
      defaultValue: false,
    }),
    removeSourceBranch: gitlabProps.triState(
      'Delete Source Branch on Merge',
      'Leave empty to keep the current value.'
    ),
    squash: gitlabProps.triState(
      'Squash Commits on Merge',
      'Leave empty to keep the current value.'
    ),
    discussionLocked: gitlabProps.triState(
      'Discussion Locked',
      'Leave empty to keep the current value.'
    ),
  },
  outputSchema: mergeRequestOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    const body: Record<string, unknown> = {};
    const title = optionalText(propsValue.title);
    if (title !== undefined) body['title'] = title;
    if (propsValue.clearDescription === true) body['description'] = '';
    else if (optionalText(propsValue.description) !== undefined)
      body['description'] = propsValue.description;
    const target = optionalText(propsValue.targetBranch);
    if (target !== undefined) body['target_branch'] = target;
    if (propsValue.stateEvent) body['state_event'] = propsValue.stateEvent;
    const addLabels = stringList({
      value: propsValue.addLabels,
      label: 'Add Labels',
    });
    if (addLabels) body['add_labels'] = addLabels.join(',');
    const removeLabels = stringList({
      value: propsValue.removeLabels,
      label: 'Remove Labels',
    });
    if (removeLabels) body['remove_labels'] = removeLabels.join(',');
    if (propsValue.clearAssignees === true) body['assignee_ids'] = [0];
    else {
      const assignees = idList({
        value: propsValue.assigneeIds,
        label: 'Assignee User IDs',
      });
      if (assignees) body['assignee_ids'] = assignees;
    }
    if (propsValue.clearReviewers === true) body['reviewer_ids'] = [0];
    else {
      const reviewers = idList({
        value: propsValue.reviewerIds,
        label: 'Reviewer User IDs',
      });
      if (reviewers) body['reviewer_ids'] = reviewers;
    }
    if (propsValue.clearMilestone === true) body['milestone_id'] = 0;
    else {
      const milestone = optionalPositiveInt({
        value: propsValue.milestoneId,
        label: 'Milestone ID',
      });
      if (milestone !== undefined) body['milestone_id'] = milestone;
    }
    const removeSource = triStateValue(propsValue.removeSourceBranch);
    if (removeSource !== undefined) body['remove_source_branch'] = removeSource;
    const squash = triStateValue(propsValue.squash);
    if (squash !== undefined) body['squash'] = squash;
    const locked = triStateValue(propsValue.discussionLocked);
    if (locked !== undefined) body['discussion_locked'] = locked;
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const path = `${projectPath(propsValue.projectId)}/merge_requests/${iid}`;
    if (locked === false && body['state_event'] !== undefined) {
      await gitlabRequest({
        auth,
        method: 'PUT',
        path,
        body: { discussion_locked: false },
      });
    }
    return gitlabRequest({ auth, method: 'PUT', path, body });
  },
});
