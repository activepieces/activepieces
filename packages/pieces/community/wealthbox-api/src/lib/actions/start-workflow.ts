import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const startWorkflow = createAction({
  name: 'start_workflow',
  displayName: 'Start Workflow',
  description: 'Triggers a workflow template on a contact/project/opportunity',
  props: {
    // Required fields
    workflow_template: Property.Number({
      displayName: 'Workflow Template ID',
      description: 'The ID of the workflow template this workflow is based on',
      required: true
    }),
    linked_type: Property.StaticDropdown({
      displayName: 'Link To',
      description: 'What type of record to link this workflow to',
      required: true,
      options: {
        options: [
          { label: 'Contact', value: 'Contact' },
          { label: 'Project', value: 'Project' },
          { label: 'Opportunity', value: 'Opportunity' }
        ]
      }
    }),
    linked_id: Property.Number({
      displayName: 'Linked Record ID',
      description: 'The ID of the record to link this workflow to',
      required: true
    }),
    linked_name: Property.ShortText({
      displayName: 'Linked Record Name',
      description: 'The name of the linked record (for reference)',
      required: false
    }),
    
    // Optional fields
    label: Property.ShortText({
      displayName: 'Workflow Label',
      description: 'A short name for the workflow (e.g., "Onboard a new client to the firm")',
      required: false
    }),
    starts_at: Property.DateTime({
      displayName: 'Start Date & Time',
      description: 'When you want the workflow to start (YYYY-MM-DD HH:MM format, optional, defaults to now)',
      required: false
    }),
    
    // Visibility
    visible_to: Property.StaticDropdown({
      displayName: 'Visible To',
      description: 'Who can view this workflow',
      required: false,
      defaultValue: 'Everyone',
      options: {
        options: [
          { label: 'Everyone', value: 'Everyone' },
          { label: 'Only Me', value: 'Only Me' },
          { label: 'My Team', value: 'My Team' }
        ]
      }
    }),
    
    // Milestone 1
    milestone_1_id: Property.ShortText({
      displayName: 'Milestone 1 ID',
      description: 'The ID of the first milestone (optional)',
      required: false
    }),
    milestone_1_name: Property.ShortText({
      displayName: 'Milestone 1 Name',
      description: 'The name of the first milestone (e.g., "Onboarding")',
      required: false
    }),
    milestone_1_date: Property.DateTime({
      displayName: 'Milestone 1 Date',
      description: 'When the first milestone should occur (YYYY-MM-DD HH:MM format)',
      required: false
    }),
    
    // Milestone 2
    milestone_2_id: Property.ShortText({
      displayName: 'Milestone 2 ID',
      description: 'The ID of the second milestone (optional)',
      required: false
    }),
    milestone_2_name: Property.ShortText({
      displayName: 'Milestone 2 Name',
      description: 'The name of the second milestone (e.g., "Account Opening")',
      required: false
    }),
    milestone_2_date: Property.DateTime({
      displayName: 'Milestone 2 Date',
      description: 'When the second milestone should occur (YYYY-MM-DD HH:MM format)',
      required: false
    }),
    
    // Milestone 3
    milestone_3_id: Property.ShortText({
      displayName: 'Milestone 3 ID',
      description: 'The ID of the third milestone (optional)',
      required: false
    }),
    milestone_3_name: Property.ShortText({
      displayName: 'Milestone 3 Name',
      description: 'The name of the third milestone',
      required: false
    }),
    milestone_3_date: Property.DateTime({
      displayName: 'Milestone 3 Date',
      description: 'When the third milestone should occur (YYYY-MM-DD HH:MM format)',
      required: false
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    

    
    // Build the request body
    const requestBody: any = {
      workflow_template: propsValue.workflow_template,
      linked_to: {
        id: propsValue.linked_id,
        type: propsValue.linked_type,
        name: propsValue.linked_name || `${propsValue.linked_type} ${propsValue.linked_id}`
      }
    };
    
    // Add optional fields if provided
    if (propsValue.label) {
      requestBody.label = propsValue.label;
    }
    
    if (propsValue.starts_at) {
      requestBody.starts_at = propsValue.starts_at;
    }
    
    if (propsValue.visible_to) {
      requestBody.visible_to = propsValue.visible_to;
    }
    
    // Handle workflow milestones
    const milestones: any[] = [];
    
    if (propsValue.milestone_1_id && propsValue.milestone_1_name) {
      const milestone: any = {
        id: propsValue.milestone_1_id,
        name: propsValue.milestone_1_name
      };
      if (propsValue.milestone_1_date) {
        milestone.milestone_date = propsValue.milestone_1_date;
      }
      milestones.push(milestone);
    }
    
    if (propsValue.milestone_2_id && propsValue.milestone_2_name) {
      const milestone: any = {
        id: propsValue.milestone_2_id,
        name: propsValue.milestone_2_name
      };
      if (propsValue.milestone_2_date) {
        milestone.milestone_date = propsValue.milestone_2_date;
      }
      milestones.push(milestone);
    }
    
    if (propsValue.milestone_3_id && propsValue.milestone_3_name) {
      const milestone: any = {
        id: propsValue.milestone_3_id,
        name: propsValue.milestone_3_name
      };
      if (propsValue.milestone_3_date) {
        milestone.milestone_date = propsValue.milestone_3_date;
      }
      milestones.push(milestone);
    }
    
    if (milestones.length > 0) {
      requestBody.workflow_milestones = milestones;
    }
    
    // Make the API request
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.crmworkspace.com/v1/workflows',
        headers: {
          'ACCESS_TOKEN': auth as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      if (response.status >= 400) {
        throw new Error(`Wealthbox API error: ${response.status} - ${JSON.stringify(response.body)}`);
      }
      
      return response.body;
    } catch (error) {
      throw new Error(`Failed to start workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});