import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const createTaskAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task and optionally link it to other items.',
  props: {
    description: Property.LongText({
      displayName: 'Description',
      description: 'What needs to be done?',
      required: true,
    }),
    party_id: capsuleCrmProps.contact_id(false),
    opportunity_id: capsuleCrmProps.opportunity_id(false),
    project_id: capsuleCrmProps.project_id(false),
    case_id: capsuleCrmProps.case_id(false),
    owner_id: capsuleCrmProps.owner_id(false),
    dueOn: Property.ShortText({
      displayName: 'Due Date',
      description: 'The date the task is due in YYYY-MM-DD format.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    return await capsuleCrmClient.createTask(auth, {
      description: propsValue.description,
      partyId: propsValue.party_id as number | undefined,
      opportunityId: propsValue.opportunity_id as number | undefined,
      projectId: propsValue.project_id as number | undefined,
      caseId: propsValue.case_id as number | undefined,
      ownerId: propsValue.owner_id as number | undefined,
      dueOn: propsValue.dueOn,
    });
  },
});
