import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const startWorkflow = createAction({
  name: 'start_workflow',
  displayName: 'Start Workflow',
  description: 'Triggers a workflow template on a contact, project, or opportunity in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Workflow Name',
      description: 'The name of the workflow to start',
      required: true,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the workflow template to use',
      required: true,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to run the workflow on',
      required: false,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project to run the workflow on',
      required: false,
    }),
    opportunity_id: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'The ID of the opportunity to run the workflow on',
      required: false,
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const workflowData: any = {
      name: context.propsValue.name,
      template_id: context.propsValue.template_id,
    };

    if (context.propsValue.contact_id) {
      workflowData.contact_id = context.propsValue.contact_id;
    }

    if (context.propsValue.project_id) {
      workflowData.project_id = context.propsValue.project_id;
    }

    if (context.propsValue.opportunity_id) {
      workflowData.opportunity_id = context.propsValue.opportunity_id;
    }

    const workflow = await client.startWorkflow(workflowData);
    return workflow;
  },
}); 