import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchWorkflowTemplates, fetchContacts, fetchProjects, fetchOpportunities, fetchUserGroups, WEALTHBOX_API_BASE, handleApiError } from '../common';

export const startWorkflow = createAction({
  name: 'start_workflow',
  displayName: 'Start Workflow',
  description: 'Triggers a workflow template on a contact/project/opportunity. Automate multi-step sequences based on CRM events.',
  props: {
    workflow_template: Property.Dropdown({
      displayName: 'Workflow Template',
      description: 'Select the workflow template to trigger',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const templates = await fetchWorkflowTemplates(auth as unknown as string);
          return {
            options: templates.map((template: any) => ({
              label: template.name || template.label || `Template ${template.id}`,
              value: template.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load workflow templates. Please check your authentication.'
          };
        }
      }
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

    linked_record: Property.DynamicProperties({
      displayName: 'Linked Record',
      description: 'Select the record to link this workflow to',
      required: true,
      refreshers: ['linked_type'],
      props: async ({ auth, linked_type }) => {
        if (!auth) {
          return {
            linked_id: Property.Number({
              displayName: 'Record ID',
              description: 'Enter the record ID manually',
              required: true
            }),
            linked_name: Property.ShortText({
              displayName: 'Record Name',
              description: 'Enter the record name for reference',
              required: false
            })
          };
        }

        try {
          let records: any[] = [];
          let recordType = '';

          const linkedTypeValue = linked_type as unknown as string;

          switch (linkedTypeValue) {
            case 'Contact':
              records = await fetchContacts(auth as unknown as string, { active: true, order: 'recent' });
              recordType = 'Contact';
              break;
            case 'Project':
              records = await fetchProjects(auth as unknown as string);
              recordType = 'Project';
              break;
            case 'Opportunity':
              records = await fetchOpportunities(auth as unknown as string);
              recordType = 'Opportunity';
              break;
            default:
              return {
                linked_id: Property.Number({
                  displayName: 'Record ID',
                  description: 'Enter the record ID manually',
                  required: true
                }),
                linked_name: Property.ShortText({
                  displayName: 'Record Name',
                  description: 'Enter the record name for reference',
                  required: false
                })
              };
          }

          const recordOptions = records.map((record: any) => ({
            label: record.name || record.title || record.label || `${recordType} ${record.id}`,
            value: record.id
          }));

          return {
            linked_id: Property.StaticDropdown({
              displayName: `${recordType} Record`,
              description: `Select the ${recordType.toLowerCase()} to link this workflow to`,
              required: true,
              options: {
                options: recordOptions
              }
            }),
            linked_name: Property.ShortText({
              displayName: 'Record Name',
              description: 'The name will be automatically populated from the selected record',
              required: false
            })
          };
        } catch (error) {
          return {
            linked_id: Property.Number({
              displayName: 'Record ID',
              description: 'Enter the record ID manually (API unavailable)',
              required: true
            }),
            linked_name: Property.ShortText({
              displayName: 'Record Name',
              description: 'Enter the record name for reference',
              required: false
            })
          };
        }
      }
    }),

    label: Property.ShortText({
      displayName: 'Workflow Label',
      description: 'A short name for the workflow (e.g., "Onboard a new client to the firm")',
      required: false
    }),

    starts_at: Property.DateTime({
      displayName: 'Start Date & Time',
      description: 'When you want the workflow to start (optional, defaults to now)',
      required: false
    }),

    visible_to: Property.Dropdown({
      displayName: 'Visible To',
      description: 'Select who can view this workflow',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const userGroups = await fetchUserGroups(auth as unknown as string);
          return {
            options: userGroups.map((group: any) => ({
              label: group.name,
              value: group.name
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load user groups. Please check your authentication.'
          };
        }
      }
    }),

    workflow_milestones: Property.DynamicProperties({
      displayName: 'Workflow Milestones',
      description: 'Add milestones to this workflow',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {
            milestones_array: Property.Array({
              displayName: 'Milestones',
              description: 'Add workflow milestones',
              required: false,
              properties: {
                milestone_id: Property.ShortText({
                  displayName: 'Milestone ID',
                  description: 'The ID of the milestone',
                  required: true
                }),
                milestone_name: Property.ShortText({
                  displayName: 'Milestone Name',
                  description: 'The name of the milestone',
                  required: true
                }),
                milestone_date: Property.DateTime({
                  displayName: 'Milestone Date',
                  description: 'When this milestone should occur',
                  required: false
                })
              }
            })
          };
        }

        try {
          return {
            milestones_array: Property.Array({
              displayName: 'Milestones',
              description: 'Add workflow milestones for this template',
              required: false,
              properties: {
                milestone_id: Property.ShortText({
                  displayName: 'Milestone ID',
                  description: 'The ID of the milestone (from template)',
                  required: true
                }),
                milestone_name: Property.ShortText({
                  displayName: 'Milestone Name',
                  description: 'The name of the milestone',
                  required: true
                }),
                milestone_date: Property.DateTime({
                  displayName: 'Milestone Date',
                  description: 'When this milestone should occur',
                  required: false
                })
              }
            })
          };
        } catch (error) {
          console.warn('Could not fetch milestones for validation:', error);
          return {
            milestones_array: Property.Array({
              displayName: 'Milestones',
              description: 'Add workflow milestones (API unavailable)',
              required: false,
              properties: {
                milestone_id: Property.ShortText({
                  displayName: 'Milestone ID',
                  description: 'The ID of the milestone',
                  required: true
                }),
                milestone_name: Property.ShortText({
                  displayName: 'Milestone Name',
                  description: 'The name of the milestone',
                  required: true
                }),
                milestone_date: Property.DateTime({
                  displayName: 'Milestone Date',
                  description: 'When this milestone should occur',
                  required: false
                })
              }
            })
          };
        }
      }
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    

    
    const requestBody: any = {
      workflow_template: propsValue.workflow_template
    };

    const linkedRecord = (propsValue as any).linked_record;
    if (linkedRecord) {
      let linkedId: number;
      let linkedName: string;

      if (linkedRecord.linked_id) {
        linkedId = linkedRecord.linked_id;
        linkedName = linkedRecord.linked_name || `${propsValue.linked_type} ${linkedId}`;
      } else {
        linkedId = linkedRecord.linked_id;
        linkedName = linkedRecord.linked_name || `${propsValue.linked_type} ${linkedId}`;
      }

      try {
        let recordName = linkedName;

        if (propsValue.linked_type === 'Contact' && linkedId) {
          const contacts = await fetchContacts(auth as unknown as string, { active: true });
          const contact = contacts.find((c: any) => c.id === linkedId);
          if (contact) {
            recordName = contact.name || `${contact.first_name} ${contact.last_name}`.trim();
          }
        } else if (propsValue.linked_type === 'Project' && linkedId) {
          const projects = await fetchProjects(auth as unknown as string);
          const project = projects.find((p: any) => p.id === linkedId);
          if (project) {
            recordName = project.name || project.title || `Project ${linkedId}`;
          }
        } else if (propsValue.linked_type === 'Opportunity' && linkedId) {
          const opportunities = await fetchOpportunities(auth as unknown as string);
          const opportunity = opportunities.find((o: any) => o.id === linkedId);
          if (opportunity) {
            recordName = opportunity.name || `Opportunity ${linkedId}`;
          }
        }

        requestBody.linked_to = {
          id: linkedId,
          type: propsValue.linked_type,
          name: recordName
        };
      } catch (error) {
        requestBody.linked_to = {
          id: linkedId,
          type: propsValue.linked_type,
          name: linkedName
        };
      }
    }
    
    if (propsValue.label) {
      requestBody.label = propsValue.label;
    }
    
    if (propsValue.starts_at) {
      requestBody.starts_at = propsValue.starts_at;
    }
    
    if (propsValue.visible_to) {
      requestBody.visible_to = propsValue.visible_to;
    }
    
    const milestonesArray = (propsValue as any).workflow_milestones?.milestones_array;
    if (milestonesArray && Array.isArray(milestonesArray) && milestonesArray.length > 0) {
      requestBody.workflow_milestones = milestonesArray.map((milestone: any) => ({
        id: milestone.milestone_id,
        name: milestone.milestone_name,
        ...(milestone.milestone_date && { milestone_date: milestone.milestone_date })
      }));
    }
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${WEALTHBOX_API_BASE}/workflows`,
        headers: {
          'ACCESS_TOKEN': auth as unknown as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status >= 400) {
        handleApiError('start workflow', response.status, response.body);
      }

      return response.body;
    } catch (error) {
      throw new Error(`Failed to start workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});