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

    const taskIdParams: {
      description: string;
      partyId: number | undefined;
      opportunityId: number | undefined;
      projectId: number | undefined;
      caseId: number | undefined;
      ownerId: number | undefined;
      dueOn: string | undefined;
    } = {
      description: propsValue.description,
      partyId: undefined,
      opportunityId: undefined,
      projectId: undefined,
      caseId: undefined,
      ownerId: propsValue.owner_id as number | undefined,
      dueOn: propsValue.dueOn,
    };

    if (propsValue.party_id) {
      taskIdParams.partyId = propsValue.party_id as number;
    } else if (propsValue.opportunity_id) {
      taskIdParams.opportunityId = propsValue.opportunity_id as number;
    } else if (propsValue.project_id) {
      taskIdParams.projectId = propsValue.project_id as number;
    } else if (propsValue.case_id) {
      taskIdParams.caseId = propsValue.case_id as number;
    }

    return await capsuleCrmClient.createTask(auth, taskIdParams);
  },
});
