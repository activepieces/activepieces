import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, optionalDay } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, optionalText, requirePositiveInt } from '../../common/props';
import { milestoneOutputSchema } from '../../output-schemas-admin';

export const updateMilestoneAction = createAction({
  auth: gitlabAuth,
  name: 'update_milestone',
  displayName: 'Update Milestone',
  description: 'Updates, closes or reopens a project milestone. Fields left empty are not changed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Changes a GitLab project milestone: title, description, start and due dates, or closes / reactivates it. Takes the global milestone id. Only the fields you set are sent; use the Clear options to blank the description or a date.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    milestoneId: adminProps.milestoneId(),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    clearDescription: Property.Checkbox({ displayName: 'Clear Description', required: false, defaultValue: false }),
    startDate: Property.ShortText({ displayName: 'Start Date', description: 'YYYY-MM-DD.', required: false }),
    clearStartDate: Property.Checkbox({ displayName: 'Clear Start Date', required: false, defaultValue: false }),
    dueDate: Property.ShortText({ displayName: 'Due Date', description: 'YYYY-MM-DD.', required: false }),
    clearDueDate: Property.Checkbox({ displayName: 'Clear Due Date', required: false, defaultValue: false }),
    stateEvent: Property.StaticDropdown({
      displayName: 'State Change',
      required: false,
      options: { options: [{ label: 'Close', value: 'close' }, { label: 'Reactivate', value: 'activate' }] },
    }),
  },
  outputSchema: milestoneOutputSchema,
  async run({ auth, propsValue }) {
    const milestoneId = requirePositiveInt({ value: propsValue.milestoneId, label: 'Milestone ID' });
    const body: Record<string, unknown> = {};
    const title = optionalText(propsValue.title);
    if (title !== undefined) body['title'] = title;
    if (propsValue.clearDescription === true) body['description'] = '';
    else if (optionalText(propsValue.description) !== undefined) body['description'] = propsValue.description;
    if (propsValue.clearStartDate === true) body['start_date'] = '';
    else {
      const start = optionalDay({ value: propsValue.startDate, label: 'Start Date' });
      if (start !== undefined) body['start_date'] = start;
    }
    if (propsValue.clearDueDate === true) body['due_date'] = '';
    else {
      const due = optionalDay({ value: propsValue.dueDate, label: 'Due Date' });
      if (due !== undefined) body['due_date'] = due;
    }
    if (propsValue.stateEvent) body['state_event'] = propsValue.stateEvent;
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    return gitlabRequest({ auth,  method: 'PUT', path: `${projectPath(propsValue.projectId)}/milestones/${milestoneId}`, body });
  },
});
