import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchContacts, fetchUsers, fetchUserGroups, fetchTaskCategories, fetchProjects, fetchOpportunities, fetchCustomFields, WEALTHBOX_API_BASE, handleApiError, DOCUMENT_TYPES, TASK_PRIORITIES, LINK_TYPES } from '../common';

export const createTask = createAction({
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates tasks tied to contacts with due dates and assignment types. Assign follow-up actions when opportunities are created.',
  props: {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the task (e.g., "Return Bill\'s call", "Follow up on proposal")',
      required: true
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due',
      required: true
    }),

    assigned_to: Property.Dropdown({
      displayName: 'Assigned To',
      description: 'Select the user who the task is assigned to',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const users = await fetchUsers(auth as unknown as string);
          const assignableUsers = users.filter((user: any) => !user.excluded_from_assignments);
          return {
            options: assignableUsers.map((user: any) => ({
              label: `${user.name} (${user.email})`,
              value: user.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load users. Please check your authentication.'
          };
        }
      }
    }),

    description: Property.LongText({
      displayName: 'Description',
      description: 'A detailed explanation of the task',
      required: false
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The priority level of the task',
      required: false,
      defaultValue: TASK_PRIORITIES.MEDIUM,
      options: {
        options: [
          { label: 'Low', value: TASK_PRIORITIES.LOW },
          { label: 'Medium', value: TASK_PRIORITIES.MEDIUM },
          { label: 'High', value: TASK_PRIORITIES.HIGH }
        ]
      }
    }),
    complete: Property.Checkbox({
      displayName: 'Mark as Complete',
      description: 'Check if the task should be created as already completed',
      required: false,
      defaultValue: false
    }),

    link_type: Property.StaticDropdown({
      displayName: 'Link To',
      description: 'What type of record to link this task to',
      required: false,
      options: {
        options: [
          { label: 'Contact', value: LINK_TYPES.CONTACT },
          { label: 'Project', value: LINK_TYPES.PROJECT },
          { label: 'Opportunity', value: LINK_TYPES.OPPORTUNITY }
        ]
      }
    }),

    linked_record: Property.DynamicProperties({
      displayName: 'Linked Record',
      description: 'Select the record to link this task to',
      required: false,
      refreshers: ['link_type'],
      props: async ({ auth, link_type }) => {
        if (!auth || !link_type) {
          return {
            linked_id: Property.ShortText({
              displayName: 'Linked Record ID',
              description: 'Enter the record ID to link to',
              required: false
            })
          };
        }

        try {
          const linkTypeStr = link_type as unknown as string;
          if (linkTypeStr === LINK_TYPES.CONTACT) {
            const contacts = await fetchContacts(auth as unknown as string, { active: true, order: 'recent' });
            return {
              linked_id: Property.StaticDropdown({
                displayName: 'Contact',
                description: 'Select the contact to link this task to',
                required: false,
                options: {
                  options: contacts.map((contact: any) => ({
                    label: contact.name || `${contact.first_name} ${contact.last_name}`.trim() || `Contact ${contact.id}`,
                    value: contact.id
                  }))
                }
              })
            };
          } else if (linkTypeStr === LINK_TYPES.PROJECT) {
            const projects = await fetchProjects(auth as unknown as string);
            return {
              linked_id: Property.StaticDropdown({
                displayName: 'Project',
                description: 'Select the project to link this task to',
                required: false,
                options: {
                  options: projects.map((project: any) => ({
                    label: project.name || `Project ${project.id}`,
                    value: project.id
                  }))
                }
              })
            };
          } else if (linkTypeStr === LINK_TYPES.OPPORTUNITY) {
            const opportunities = await fetchOpportunities(auth as unknown as string);
            return {
              linked_id: Property.StaticDropdown({
                displayName: 'Opportunity',
                description: 'Select the opportunity to link this task to',
                required: false,
                options: {
                  options: opportunities.map((opportunity: any) => ({
                    label: opportunity.name || `Opportunity ${opportunity.id}`,
                    value: opportunity.id
                  }))
                }
              })
            };
          }
        } catch (error) {
          return {
            linked_id: Property.ShortText({
              displayName: 'Linked Record ID',
              description: 'Enter the record ID to link to (API unavailable)',
              required: false
            })
          };
        }

        return {
          linked_id: Property.ShortText({
            displayName: 'Linked Record ID',
            description: 'Enter the record ID to link to',
            required: false
          })
        };
      }
    }),

    category: Property.Dropdown({
      displayName: 'Category',
      description: 'Select the category this task belongs to',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const categories = await fetchTaskCategories(auth as unknown as string);
          return {
            options: categories.map((category: any) => ({
              label: category.name,
              value: category.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load task categories. Please check your authentication.'
          };
        }
      }
    }),

    visible_to: Property.Dropdown({
      displayName: 'Visible To',
      description: 'Select who can view this task',
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

    due_later: Property.ShortText({
      displayName: 'Due Later',
      description: 'Interval for when this task is due after start (e.g., "2 days later at 5:00 PM")',
      required: false
    }),

    custom_fields: Property.DynamicProperties({
      displayName: 'Custom Fields',
      description: 'Add custom fields to this task',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this task',
              required: false,
              properties: {
                custom_field: Property.ShortText({
                  displayName: 'Custom Field',
                  description: 'Custom field name',
                  required: true
                }),
                value: Property.ShortText({
                  displayName: 'Value',
                  description: 'The value for this custom field',
                  required: true
                })
              }
            })
          };
        }

        try {
          const customFields = await fetchCustomFields(auth as unknown as string, DOCUMENT_TYPES.TASK);
          const customFieldOptions = customFields.map((field: any) => ({
            label: field.name,
            value: field.name
          }));

          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this task',
              required: false,
              properties: {
                custom_field: Property.StaticDropdown({
                  displayName: 'Custom Field',
                  description: 'Select a custom field for this task',
                  required: true,
                  options: {
                    options: customFieldOptions
                  }
                }),
                value: Property.ShortText({
                  displayName: 'Value',
                  description: 'The value for this custom field',
                  required: true
                })
              }
            })
          };
        } catch (error) {
          return {
            custom_fields_array: Property.Array({
              displayName: 'Custom Fields',
              description: 'Add custom fields to this task (API unavailable)',
              required: false,
              properties: {
                custom_field: Property.ShortText({
                  displayName: 'Custom Field Name',
                  description: 'Enter the custom field name exactly',
                  required: true
                }),
                value: Property.ShortText({
                  displayName: 'Value',
                  description: 'The value for this custom field',
                  required: true
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
      throw new Error('API access token is required');
    }

    const requestBody: any = {
      name: propsValue.name,
      due_date: propsValue.due_date
    };

    if (propsValue.assigned_to) {
      requestBody.assigned_to = propsValue.assigned_to;
    }

    if (propsValue.description) {
      requestBody.description = propsValue.description;
    }

    if (propsValue.priority) {
      requestBody.priority = propsValue.priority;
    }

    if (propsValue.complete !== undefined) {
      requestBody.complete = propsValue.complete;
    }

    if (propsValue.category) {
      requestBody.category = propsValue.category;
    }

    if (propsValue.visible_to) {
      requestBody.visible_to = propsValue.visible_to;
    }

    if (propsValue.due_later) {
      requestBody.due_later = propsValue.due_later;
    }

    const linkedRecord = (propsValue as any).linked_record;
    if (propsValue.link_type && linkedRecord?.linked_id) {
      try {
        let recordName = `${propsValue.link_type} ${linkedRecord.linked_id}`;

        const linkTypeStr = propsValue.link_type as string;
        if (linkTypeStr === LINK_TYPES.CONTACT) {
          const contacts = await fetchContacts(auth as unknown as string, { active: true });
          const contact = contacts.find((c: any) => c.id === linkedRecord.linked_id);
          if (contact) {
            recordName = contact.name || `${contact.first_name} ${contact.last_name}`.trim();
          }
        } else if (linkTypeStr === LINK_TYPES.PROJECT) {
          const projects = await fetchProjects(auth as unknown as string);
          const project = projects.find((p: any) => p.id === linkedRecord.linked_id);
          if (project) {
            recordName = project.name;
          }
        } else if (linkTypeStr === LINK_TYPES.OPPORTUNITY) {
          const opportunities = await fetchOpportunities(auth as unknown as string);
          const opportunity = opportunities.find((o: any) => o.id === linkedRecord.linked_id);
          if (opportunity) {
            recordName = opportunity.name;
          }
        }

        requestBody.linked_to = [{
          id: linkedRecord.linked_id,
          type: propsValue.link_type,
          name: recordName
        }];
      } catch (error) {
        requestBody.linked_to = [{
          id: linkedRecord.linked_id,
          type: propsValue.link_type,
          name: `${propsValue.link_type} ${linkedRecord.linked_id}`
        }];
      }
    }

    const customFieldsArray = (propsValue as any).custom_fields_array;
    if (customFieldsArray && Array.isArray(customFieldsArray) && customFieldsArray.length > 0) {
      try {
        const customFields = await fetchCustomFields(auth as unknown as string, DOCUMENT_TYPES.TASK);
        const customFieldMap = new Map(customFields.map((field: any) => [field.name, field.id]));

        requestBody.custom_fields = customFieldsArray.map((field: any) => {
          const fieldId = customFieldMap.get(field.custom_field);
          if (!fieldId) {
            throw new Error(`Custom field "${field.custom_field}" not found. Please check the field name.`);
          }
          return {
            id: fieldId,
            value: field.value
          };
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Custom field')) {
          throw error;
        }
        console.warn('Could not fetch custom fields for validation:', error);
        requestBody.custom_fields = customFieldsArray.map((field: any) => ({
          id: field.custom_field,
          value: field.value
        }));
      }
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${WEALTHBOX_API_BASE}/tasks`,
        headers: {
          'ACCESS_TOKEN': auth as unknown as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status >= 400) {
        handleApiError('create task', response.status, response.body);
      }

      return response.body;
    } catch (error) {
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});
