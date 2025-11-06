import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { 
  podioApiCall, 
  getAccessToken, 
  dynamicAppProperty,
  silentProperty, 
  hookProperty, 
  formatFieldValues
} from '../common';

export const createItemAction = createAction({
  auth: podioAuth,
  name: 'create_item',
  displayName: 'Create Item',
  description: 'Create a new record in a Podio app with specified field values.',
  props: {
    orgId: Property.Dropdown({
      displayName: 'Organization (Optional)',
      description: 'Select an organization to filter apps by workspace. Leave empty to see all apps.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Podio account first',
            options: [],
          };
        }

        try {
          const accessToken = getAccessToken(auth as any);
          
          const orgs = await podioApiCall<any[]>({
            method: HttpMethod.GET,
            accessToken,
            resourceUri: '/org/',
          });

          if (!orgs || orgs.length === 0) {
            return {
              options: [],
              placeholder: 'No organizations found',
            };
          }

          return {
            options: orgs.map((org: any) => ({
              label: org.name,
              value: org.org_id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load organizations. Check your connection.',
          };
        }
      },
    }),
    spaceId: Property.Dropdown({
      displayName: 'Space (Optional)',
      description: 'Select a workspace to filter apps. Leave empty to see all apps in the organization.',
      required: false,
      refreshers: ['orgId'],
      options: async ({ auth, orgId }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Podio account first',
            options: [],
          };
        }

        if (!orgId) {
          return {
            disabled: true,
            placeholder: 'Select an organization first',
            options: [],
          };
        }

        try {
          const accessToken = getAccessToken(auth as any);
          
          const resourceUri = `/org/${orgId}/space/`;

          const spaces = await podioApiCall<any[]>({
            method: HttpMethod.GET,
            accessToken,
            resourceUri,
          });

          if (!spaces || spaces.length === 0) {
            return {
              options: [],
              placeholder: 'No spaces found in this organization',
            };
          }

          return {
            options: spaces.map((space: any) => ({
              label: `${space.name}${space.org ? ` (${space.org.name})` : ''}`,
              value: space.space_id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load spaces. Check your connection.',
          };
        }
      },
    }),
    appId: dynamicAppProperty,
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'The external id of the item. This can be used to hold a reference to the item in an external system.',
      required: false,
    }),
    
    appFields: Property.DynamicProperties({
      displayName: 'App Fields',
      description: 'Configure values for the fields in the selected app',
      required: true,
      refreshers: ['appId'],
      props: async ({ auth, appId }) => {
        if (!auth || !appId) {
          return {};
        }

        try {
          const accessToken = getAccessToken(auth as any);
          
          const app = await podioApiCall<any>({
            method: HttpMethod.GET,
            accessToken,
            resourceUri: `/app/${appId}`,
            queryParams: { view: 'full' }
          });

          
          
          const fields = app.fields || [];
          
          
          if (!fields || fields.length === 0) {
            return {};
          }

          const fieldProperties: Record<string, any> = {};

          for (const field of fields) {
            try {
              const fieldKey = `field_${field.field_id}`;
              const fieldConfig = field.config;
              const fieldType = field.type;
              const isRequired = fieldConfig.required || false;
              
              
              const baseProps = {
                displayName: fieldConfig.label,
                description: fieldConfig.description || `Enter value for ${fieldConfig.label}`,
                required: isRequired,
              };

              
              switch (fieldType) {
                case 'text':
                  fieldProperties[fieldKey] = Property.LongText({
                    ...baseProps,
                    description: `${baseProps.description}. Supports plain text, markdown, or HTML.`,
                  });
                  break;

                case 'number':
                  fieldProperties[fieldKey] = Property.Number({
                    ...baseProps,
                    description: `${baseProps.description}. Enter a numeric value.`,
                  });
                  break;

                case 'money':
                  fieldProperties[fieldKey] = Property.Object({
                    ...baseProps,
                    description: `${baseProps.description}. Format: {"value": "amount", "currency": "USD"}`,
                  });
                  break;

                case 'date':
                  fieldProperties[fieldKey] = Property.Object({
                    ...baseProps,
                    description: `${baseProps.description}. Format: {"start_date": "YYYY-MM-DD", "start_time": "HH:MM:SS", "end_date": "YYYY-MM-DD", "end_time": "HH:MM:SS"}`,
                  });
                  break;

                case 'contact':
                  fieldProperties[fieldKey] = Property.Number({
                    ...baseProps,
                    description: `${baseProps.description}. Enter the Podio profile ID of the contact.`,
                  });
                  break;

                case 'member':
                  fieldProperties[fieldKey] = Property.Number({
                    ...baseProps,
                    description: `${baseProps.description}. Enter the Podio user ID of the member.`,
                  });
                  break;

                case 'app':
                  fieldProperties[fieldKey] = Property.Number({
                    ...baseProps,
                    description: `${baseProps.description}. Enter the ID of the item from the linked app.`,
                  });
                  break;

                case 'category':
                case 'status': {
                  
                  
                  let staticOptions: Array<{label: string, value: any}> = [];
                  
                  if (fieldConfig.settings?.options && Array.isArray(fieldConfig.settings.options)) {
                    staticOptions = fieldConfig.settings.options.map((option: any) => ({
                      label: option.text || option.name || option.value || `Option ${option.id}`,
                      value: option.id || option.value,
                    }));
                  }
                  
                  if (staticOptions.length > 0) {
                    fieldProperties[fieldKey] = Property.StaticDropdown({
                      ...baseProps,
                      options: {
                        options: staticOptions,
                      },
                    });
                  } else {
                    
                    fieldProperties[fieldKey] = Property.Number({
                      ...baseProps,
                      description: `${baseProps.description}. Enter the ${fieldType} option ID manually.`,
                    });
                  }
                  break;
                }

                case 'email':
                  fieldProperties[fieldKey] = Property.Object({
                    ...baseProps,
                    description: `${baseProps.description}. Format: {"value": "email@example.com", "type": "work|home|other"}`,
                  });
                  break;

                case 'phone':
                  fieldProperties[fieldKey] = Property.Object({
                    ...baseProps,
                    description: `${baseProps.description}. Format: {"value": "phone_number", "type": "mobile|work|home|main|work_fax|private_fax|other"}`,
                  });
                  break;

                case 'location':
                  fieldProperties[fieldKey] = Property.ShortText({
                    ...baseProps,
                    description: `${baseProps.description}. Enter a location (address, coordinates, etc.)`,
                  });
                  break;

                case 'image':
                case 'file':
                  fieldProperties[fieldKey] = Property.Number({
                    ...baseProps,
                    description: `${baseProps.description}. Enter the file ID of the uploaded ${fieldType}.`,
                  });
                  break;

                case 'progress':
                  fieldProperties[fieldKey] = Property.Number({
                    ...baseProps,
                    description: `${baseProps.description}. Enter a value between 0 and 100.`,
                  });
                  break;

                default:
                  fieldProperties[fieldKey] = Property.ShortText({
                    ...baseProps,
                    description: `${baseProps.description}. Field type: ${fieldType}`,
                  });
              }
            } catch (fieldError) {
              
              const fieldKey = `field_${field.field_id}`;
              fieldProperties[fieldKey] = Property.ShortText({
                displayName: `${field.config?.label || 'Unknown Field'} (Fallback)`,
                description: `Field type "${field.type}" - Manual entry required. Original error: ${fieldError instanceof Error ? fieldError.message : 'Unknown error'}`,
                required: field.config?.required || false,
              });
            }
          }

          
          return fieldProperties;
        } catch (error) {
          return {};
        }
      },
    }),
    legacyFields: Property.Object({
      displayName: 'Advanced: Custom Fields JSON',
      description: 'Advanced: Use this for complex field configurations. Format: {"field_id": {"value": "content"}}. Only use if the dynamic fields above don\'t meet your needs.',
      required: false,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'Temporary files that have been uploaded and should be attached to this item',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The tags to put on the item',
      required: false,
    }),
    reminder: Property.Object({
      displayName: 'Reminder',
      description: 'Optional reminder on this item. Format: {"remind_delta": minutes_before_due_date}',
      required: false,
    }),
    recurrence: Property.Object({
      displayName: 'Recurrence',
      description: 'The recurrence for the task, if any. Format: {"name": "weekly|monthly|yearly", "config": {...}, "step": 1, "until": "date"}',
      required: false,
    }),
    linkedAccountId: Property.Number({
      displayName: 'Linked Account ID',
      description: 'The linked account to use for the meeting',
      required: false,
    }),
    ref: Property.Object({
      displayName: 'Reference',
      description: 'The reference for the new item, if any. Format: {"type": "item", "id": reference_id}',
      required: false,
    }),
    hook: hookProperty,
    silent: silentProperty,
  },
  async run(context) {
    
    const accessToken = getAccessToken(context.auth);
    const { 
      orgId,
      spaceId,
      appId, 
      externalId, 
      appFields,
      legacyFields, 
      fileIds, 
      tags, 
      reminder, 
      recurrence, 
      linkedAccountId, 
      ref, 
      hook, 
      silent 
    } = context.propsValue;


    if (!appId) {
      throw new Error('App selection is required. Please select a Podio app from the dropdown.');
    }

    let formattedFields: Record<string, any> = {};
    
    if (appFields && Object.keys(appFields).length > 0) {
      try {
        const accessToken = getAccessToken(context.auth);
        const app = await podioApiCall<any>({
          method: HttpMethod.GET,
          accessToken,
          resourceUri: `/app/${appId}`,
          queryParams: { view: 'full' }
        });
        
        const fieldDefinitions = app.fields || [];
        
        formattedFields = formatFieldValues(fieldDefinitions, appFields);
      } catch (error) {
        throw new Error(`Failed to process app fields: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (legacyFields && typeof legacyFields === 'object' && Object.keys(legacyFields).length > 0) {
      formattedFields = { ...formattedFields, ...legacyFields };
    }

    if (Object.keys(formattedFields).length === 0) {
      throw new Error('At least one field value is required to create an item. Please configure the app fields or provide legacy field data.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array of numbers.');
    }

    if (tags && !Array.isArray(tags)) {
      throw new Error('Tags must be provided as an array of strings.');
    }

    const body: any = {
      fields: formattedFields,
    };

    if (externalId) {
      body.external_id = externalId;
    }

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      body.file_ids = fileIds;
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      body.tags = tags;
    }

    if (reminder && typeof reminder === 'object' && Object.keys(reminder).length > 0) {
      if (reminder['remind_delta'] && typeof reminder['remind_delta'] === 'number') {
        body.reminder = reminder;
      }
    }

    if (recurrence && typeof recurrence === 'object' && Object.keys(recurrence).length > 0) {
      if (recurrence['name'] && recurrence['config']) {
        body.recurrence = recurrence;
      }
    }

    if (linkedAccountId) {
      body.linked_account_id = linkedAccountId;
    }

    if (ref && typeof ref === 'object' && Object.keys(ref).length > 0) {
      if (ref['type'] && ref['id']) {
        body.ref = ref;
      }
    }

    const queryParams: any = {};
    if (typeof hook === 'boolean') {
      queryParams.hook = hook.toString();
    }
    if (typeof silent === 'boolean') {
      queryParams.silent = silent.toString();
    }

    const response = await podioApiCall<{
      item_id: number;
      title: string;
    }>({
      method: HttpMethod.POST,
      accessToken,
      resourceUri: `/item/app/${appId}/`,
      body,
      queryParams,
    });

    return response;
  },
}); 