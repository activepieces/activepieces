import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, silentProperty, hookProperty, dynamicAppProperty, dynamicItemProperty, formatFieldValues } from '../common';

export const updateItemAction = createAction({
  auth: podioAuth,
  name: 'update_item',
  displayName: 'Update Item',
  description: 'Update an existing record in a Podio app with specified field values. Only provided fields will be updated.',
  props: {
    appId: dynamicAppProperty,
    itemId: dynamicItemProperty,
    appFields: Property.DynamicProperties({
      displayName: 'App Fields',
      description: 'Configure values for the fields you want to update in the selected app',
      required: false,
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
              const isRequired = false;
              
              
              
              const baseProps = {
                displayName: fieldConfig.label,
                description: fieldConfig.description || `Update value for ${fieldConfig.label}`,
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
                required: false,
              });
            }
          }

          
          return fieldProperties;
        } catch (error) {
          return {};
        }
      },
    }),
    revision: Property.Number({
      displayName: 'Revision',
      description: 'The revision of the item that is being updated. Optional for conflict detection.',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'The new external_id of the item',
      required: false,
    }),
    legacyFields: Property.Object({
      displayName: 'Legacy Fields (Advanced)',
      description: 'Manual field configuration using field_id or external_id as keys. Use this for advanced scenarios or when dynamic fields are not sufficient.',
      required: false,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'The list of attachments',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The list of tags',
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
      description: 'The linked account to use for meetings',
      required: false,
    }),
    ref: Property.Object({
      displayName: 'Reference',
      description: 'The reference of the item. Format: {"type": "reference_type", "id": reference_id}',
      required: false,
    }),
    hook: hookProperty,
    silent: silentProperty,
  },
  async run(context) {    
    const accessToken = getAccessToken(context.auth);
    const { 
      appId,
      itemId, 
      appFields,
      revision, 
      externalId, 
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
      throw new Error('App selection is required to update an item. Please select an app first.');
    }

    if (!itemId) {
      throw new Error('Item selection is required to update an item. Please select an item from the dropdown.');
    }

    let formattedFields: Record<string, any> = {};
    
    if (appFields && Object.keys(appFields).length > 0) {
      try {
        
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

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array of numbers.');
    }

    if (tags && !Array.isArray(tags)) {
      throw new Error('Tags must be provided as an array of strings.');
    }

    if (reminder && reminder['remind_delta'] !== undefined && typeof reminder['remind_delta'] !== 'number') {
      throw new Error('Reminder remind_delta must be a number representing minutes before due date.');
    }

    if (linkedAccountId && typeof linkedAccountId !== 'number') {
      throw new Error('Linked Account ID must be a number.');
    }

    if (ref && (!ref['type'] || !ref['id'])) {
      throw new Error('Reference must include both "type" and "id" properties.');
    }

    const body: any = {};

    if (revision !== undefined) {
      if (typeof revision !== 'number') {
        throw new Error('Revision must be a number.');
      }
      body.revision = revision;
    }

    if (externalId && externalId.trim()) {
      body.external_id = externalId.trim();
    }

    if (Object.keys(formattedFields).length > 0) {
      body.fields = formattedFields;
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
      revision: number;
      title: string;
    }>({
      method: HttpMethod.PUT,
      accessToken,
      resourceUri: `/item/${itemId}`,
      body,
      queryParams,
    });

    return response;
  },
}); 