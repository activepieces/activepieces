import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { claritiaAuth } from '../auth';
import { claritiaCall } from '../common';
import { workflowDropdown } from '../props';

export const addToWorkflow = createAction({
  auth: claritiaAuth,
  name: 'add_to_workflow',
  displayName: 'Add Contact to Workflow',
  description: "Adds someone to a live workflow, making the contact if it's new.",
  props: {
    workflow: workflowDropdown,
    email: Property.ShortText({ displayName: 'Email', required: true }),
    first_name: Property.ShortText({ displayName: 'First name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last name', required: false }),
  },
  async run(context) {
    const { workflow, email, first_name, last_name } = context.propsValue;
    return claritiaCall(context.auth, HttpMethod.POST, `/workflows/${workflow}/contacts`, { email, first_name, last_name });
  },
});
