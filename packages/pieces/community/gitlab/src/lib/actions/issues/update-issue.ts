import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  gitlabProps,
  idList,
  optionalIsoDate,
  optionalPositiveInt,
  optionalText,
  requirePositiveInt,
  stringList,
  triStateValue,
} from '../../common/props';
import { issueOutputSchema } from '../../output-schemas';

export const updateIssueAction = createAction({
  auth: gitlabAuth,
  name: 'update_issue',
  displayName: 'Update Issue',
  description:
    'Updates the fields of an issue. Fields left empty are not changed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes an existing GitLab issue: title, description, close or reopen, add or remove labels, assignees, milestone, due date, confidential, discussion lock. Only the fields you set are sent; use the Clear options to blank a field. Use Move Issue to change its project.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
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
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'YYYY-MM-DD.',
      required: false,
    }),
    clearDueDate: Property.Checkbox({
      displayName: 'Clear Due Date',
      required: false,
      defaultValue: false,
    }),
    confidential: gitlabProps.triState(
      'Confidential',
      'Leave empty to keep the current value.'
    ),
    discussionLocked: gitlabProps.triState(
      'Discussion Locked',
      'Leave empty to keep the current value.'
    ),
  },
  outputSchema: issueOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.issueIid,
      label: 'Issue IID',
    });
    const body: Record<string, unknown> = {};
    const title = optionalText(propsValue.title);
    if (title !== undefined) body['title'] = title;
    if (propsValue.clearDescription === true) body['description'] = '';
    else if (optionalText(propsValue.description) !== undefined)
      body['description'] = propsValue.description;
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
    if (propsValue.clearMilestone === true) body['milestone_id'] = 0;
    else {
      const milestone = optionalPositiveInt({
        value: propsValue.milestoneId,
        label: 'Milestone ID',
      });
      if (milestone !== undefined) body['milestone_id'] = milestone;
    }
    if (propsValue.clearDueDate === true) body['due_date'] = '';
    else {
      const due = optionalIsoDate({
        value: propsValue.dueDate,
        label: 'Due Date',
      });
      if (due !== undefined) body['due_date'] = due;
    }
    const confidential = triStateValue(propsValue.confidential);
    if (confidential !== undefined) body['confidential'] = confidential;
    const locked = triStateValue(propsValue.discussionLocked);
    if (locked !== undefined) body['discussion_locked'] = locked;
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const path = `${projectPath(propsValue.projectId)}/issues/${iid}`;
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
