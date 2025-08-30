import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient, wealthboxCommon } from '../common';

export const startWorkflowAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'start_workflow',
  displayName: 'Start Workflow',
  description: 'Triggers a workflow template on a contact/project/opportunity',
  props: {
    workflow_template_id: wealthboxCommon.workflowTemplateId,
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      required: true,
      options: {
        options: [
          { label: 'Contact', value: 'Contact' },
          { label: 'Project', value: 'Project' },
          { label: 'Opportunity', value: 'Opportunity' },
        ],
      },
    }),
    resource_id: Property.DynamicProperties({
      displayName: 'Resource',
      required: true,
      refreshers: ['resource_type'],
      properties: async ({ resource_type }) => {
        if (resource_type === 'Contact') {
          return {
            contact_id: wealthboxCommon.contactId,
          };
        } else if (resource_type === 'Project') {
          return {
            project_id: Property.Number({
              displayName: 'Project ID',
              required: true,
            }),
          };
        } else {
          return {
            opportunity_id: Property.Number({
              displayName: 'Opportunity ID',
              required: true,
            }),
          };
        }
      },
    }),
  },
  async run(context) {
    const { workflow_template_id, resource_type, resource_id } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    let resourceId: number;
    if (resource_type === 'Contact') {
      resourceId = resource_id.contact_id;
    } else if (resource_type === 'Project') {
      resourceId = resource_id.project_id;
    } else {
      resourceId = resource_id.opportunity_id;
    }

    const workflowData = {
      workflow_template_id,
      resource_type,
      resource_id: resourceId,
    };

    const result = await client.createWorkflow(workflowData);
    
    return result;
  },
});
