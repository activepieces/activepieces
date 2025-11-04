import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wufooApiCall } from './client';

interface WufooForm {
  Name: string;
  Hash: string;
  Url: string;
}

interface WufooFormField {
  ID: string;
  Title: string;
  Type: string;
  IsRequired: string;
  Instructions: string;
  ClassNames: string;
  DefaultVal: string;
  Page: string;
  IsSystem?: boolean;
  
  SubFields?: Array<{
    ID: string;
    Label: string;
    DefaultVal: string;
  }>;
  
  Choices?: Array<{
    Label: string;
    Score?: number; // For Likert fields
  }>;
  
  // For fields that allow "Other" option
  HasOtherField?: boolean;
}

interface WufooFormFieldsResponse {
  Fields: WufooFormField[];
}

export const formIdentifier = Property.Dropdown({
  displayName: 'Form Identifier (Name and Hash)',
  description: 'Select a Wufoo form to work with.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    const { apiKey, subdomain } = auth as { apiKey: string; subdomain: string };

    if (!apiKey || !subdomain) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Wufoo account.',
      };
    }

    let response: { Forms: WufooForm[] };

    try {
      response = await wufooApiCall<{ Forms: WufooForm[] }>({
        auth: { apiKey, subdomain },
        method: HttpMethod.GET,
        resourceUri: '/forms.json',
      });
    } catch (e) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error fetching forms: ${(e as Error).message}`,
      };
    }

    const forms = Array.isArray(response.Forms) ? response.Forms : [];

    if (forms.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No forms found in your account.',
      };
    }

    return {
      disabled: false,
      options: forms.map((form) => ({
        label: `${form.Name} (${form.Hash})`,
        value: form.Hash,
      })),
    };
  },
});

export const dynamicFormFields = Property.DynamicProperties({
  displayName: 'Form Fields',
  description: 'Fill out the form fields with the data you want to submit. Field types and validation are automatically configured based on your form structure.',
  required: true,
  refreshers: ['formIdentifier', 'format'],
  props: async ({ auth, formIdentifier, format }) => {
    if (!auth || !formIdentifier) {
      return {};
    }

    const { apiKey, subdomain } = auth as { apiKey: string; subdomain: string };
    const responseFormat = (format as unknown as string) || 'json';

    try {
      const response = await wufooApiCall<WufooFormFieldsResponse | any>({
        auth: { apiKey, subdomain },
        method: HttpMethod.GET,
        resourceUri: `/forms/${formIdentifier}/fields.json`,
      });

      let parsedResponse = response;
      if (typeof response === 'string' && response.includes('OUTPUT =')) {
        const match = response.match(/OUTPUT = ({.*?});/);
        if (match) {
          try {
            parsedResponse = JSON.parse(match[1]);
          } catch (e) {
            console.error('Error parsing Wufoo fields response:', e);
            parsedResponse = response;
          }
        }
      }

      let fields: WufooFormField[] = [];
      
      if (parsedResponse && typeof parsedResponse === 'object') {
        if ((parsedResponse as any).Fields && Array.isArray((parsedResponse as any).Fields)) {
          fields = (parsedResponse as any).Fields;
        } else if (responseFormat === 'json') {
          fields = (parsedResponse as WufooFormFieldsResponse).Fields || [];
        } else if (responseFormat === 'xml') {
          const fieldsContainer = parsedResponse.Fields || parsedResponse;
          if (Array.isArray(fieldsContainer)) {
            fields = fieldsContainer;
          } else if (fieldsContainer.Field) {
            if (Array.isArray(fieldsContainer.Field)) {
              fields = fieldsContainer.Field;
            } else {
              fields = [fieldsContainer.Field];
            }
          }
        }
      }

      const props: DynamicPropsValue = {};

      for (const field of fields) {
        // Skip system fields (marked with IsSystem: true) and common system field IDs
        if (field.IsSystem || 
            ['EntryId', 'DateCreated', 'CreatedBy', 'LastUpdated', 'UpdatedBy', 
             'Status', 'PurchaseTotal', 'Currency', 'TransactionId', 'MerchantType', 
             'IP', 'LastPage', 'CompleteSubmission'].includes(field.ID)) {
          continue;
        }

        const fieldId = field.ID.startsWith('Field') ? field.ID : `Field${field.ID}`;
        const fieldTitle = field.Title || `Field ${field.ID}`;
        const fieldDescription = field.Instructions || `Enter value for ${fieldTitle}`;
        const isRequired = field.IsRequired === '1';

        switch (field.Type) {
          case 'text':
          case 'email':
          case 'url':
            props[fieldId] = Property.ShortText({
              displayName: fieldTitle,
              description: fieldDescription,
              required: isRequired,
              defaultValue: field.DefaultVal || undefined,
            });
            break;

          case 'textarea':
            props[fieldId] = Property.LongText({
              displayName: fieldTitle,
              description: fieldDescription,
              required: isRequired,
              defaultValue: field.DefaultVal || undefined,
            });
            break;

          case 'number':
          case 'money':
            props[fieldId] = Property.Number({
              displayName: fieldTitle,
              description: field.Type === 'money' ? 
                `${fieldDescription} (Enter monetary amount)` : fieldDescription,
              required: isRequired,
              defaultValue: field.DefaultVal ? parseFloat(field.DefaultVal) : undefined,
            });
            break;

          case 'date':
            props[fieldId] = Property.DateTime({
              displayName: fieldTitle,
              description: `${fieldDescription} (Date will be converted to YYYYMMDD format for Wufoo)`,
              required: isRequired,
            });
            break;

          case 'time':
            props[fieldId] = Property.ShortText({
              displayName: fieldTitle,
              description: `${fieldDescription} (Enter time in HH:MM format)`,
              required: isRequired,
              defaultValue: field.DefaultVal || undefined,
            });
            break;

          case 'phone':
            props[fieldId] = Property.ShortText({
              displayName: fieldTitle,
              description: `${fieldDescription} (Phone number)`,
              required: isRequired,
              defaultValue: field.DefaultVal || undefined,
            });
            break;

          case 'select':
          case 'radio':
            if (field.Choices && field.Choices.length > 0) {
              const options = field.Choices
                .filter(choice => choice.Label && choice.Label.trim() !== '')
                .map((choice) => ({
                  label: choice.Label,
                  value: choice.Label,
                }));

              if (options.length > 0) {
                props[fieldId] = Property.StaticDropdown({
                  displayName: fieldTitle,
                  description: field.HasOtherField ? 
                    `${fieldDescription} (Includes "Other" option)` : fieldDescription,
                  required: isRequired,
                  options: {
                    disabled: false,
                    options: options,
                  },
                });
              } else {
                // Fallback to text input if no valid choices
                props[fieldId] = Property.ShortText({
                  displayName: fieldTitle,
                  description: fieldDescription,
                  required: isRequired,
                  defaultValue: field.DefaultVal || undefined,
                });
              }
            } else {
              props[fieldId] = Property.ShortText({
                displayName: fieldTitle,
                description: fieldDescription,
                required: isRequired,
                defaultValue: field.DefaultVal || undefined,
              });
            }
            break;

          case 'checkbox':
            if (field.SubFields && field.SubFields.length > 0) {
              // Handle checkbox fields with multiple options
              const options = field.SubFields.map((subField) => ({
                label: subField.Label,
                value: subField.ID,
              }));

              props[fieldId] = Property.StaticMultiSelectDropdown({
                displayName: fieldTitle,
                description: `${fieldDescription} (Select multiple options)`,
                required: isRequired,
                options: {
                  disabled: false,
                  options: options,
                },
              });
            } else {
              // Single checkbox
              props[fieldId] = Property.Checkbox({
                displayName: fieldTitle,
                description: fieldDescription,
                required: isRequired,
                defaultValue: field.DefaultVal === '1' || field.DefaultVal === 'true',
              });
            }
            break;

          case 'address':
            if (field.SubFields && field.SubFields.length > 0) {
              // Create individual fields for each address component
              for (const subField of field.SubFields) {
                props[subField.ID] = Property.ShortText({
                  displayName: `${fieldTitle} - ${subField.Label}`,
                  description: `Enter ${subField.Label.toLowerCase()}`,
                  required: isRequired && ['Street Address', 'City'].includes(subField.Label),
                  defaultValue: subField.DefaultVal || undefined,
                });
              }
            } else {
              // Fallback to single address field
              props[fieldId] = Property.LongText({
                displayName: fieldTitle,
                description: `${fieldDescription} (Complete address)`,
                required: isRequired,
                defaultValue: field.DefaultVal || undefined,
              });
            }
            break;

          case 'shortname':
            if (field.SubFields && field.SubFields.length > 0) {
              // Create individual fields for name components (First, Last, etc.)
              for (const subField of field.SubFields) {
                props[subField.ID] = Property.ShortText({
                  displayName: `${fieldTitle} - ${subField.Label}`,
                  description: `Enter ${subField.Label.toLowerCase()} name`,
                  required: isRequired,
                  defaultValue: subField.DefaultVal || undefined,
                });
              }
            } else {
              props[fieldId] = Property.ShortText({
                displayName: fieldTitle,
                description: fieldDescription,
                required: isRequired,
                defaultValue: field.DefaultVal || undefined,
              });
            }
            break;

          case 'likert':
            if (field.Choices && field.Choices.length > 0) {
              const options = field.Choices.map((choice) => ({
                label: `${choice.Label}${choice.Score ? ` (Score: ${choice.Score})` : ''}`,
                value: choice.Label,
              }));

              if (field.SubFields && field.SubFields.length > 0) {
                // Create a dropdown for each Likert row
                for (const subField of field.SubFields) {
                  props[subField.ID] = Property.StaticDropdown({
                    displayName: `${fieldTitle} - ${subField.Label}`,
                    description: `Rate: ${subField.Label}`,
                    required: isRequired,
                    options: {
                      disabled: false,
                      options: options,
                    },
                  });
                }
              } else {
                props[fieldId] = Property.StaticDropdown({
                  displayName: fieldTitle,
                  description: fieldDescription,
                  required: isRequired,
                  options: {
                    disabled: false,
                    options: options,
                  },
                });
              }
            } else {
              // Fallback if no choices are provided
              props[fieldId] = Property.ShortText({
                displayName: fieldTitle,
                description: `${fieldDescription} (Likert scale)`,
                required: isRequired,
                defaultValue: field.DefaultVal || undefined,
              });
            }
            break;

          case 'rating':
            props[fieldId] = Property.Number({
              displayName: fieldTitle,
              description: `${fieldDescription} (Rating scale)`,
              required: isRequired,
              defaultValue: field.DefaultVal ? parseFloat(field.DefaultVal) : undefined,
            });
            break;

          case 'file':
            props[fieldId] = Property.File({
              displayName: fieldTitle,
              description: `${fieldDescription} (File upload)`,
              required: isRequired,
            });
            break;

          default:
            // For unknown field types, default to text input with field type in description
            props[fieldId] = Property.ShortText({
              displayName: fieldTitle,
              description: `${fieldDescription} (Field type: ${field.Type})`,
              required: isRequired,
              defaultValue: field.DefaultVal || undefined,
            });
            break;
        }
      }

      return props;
    } catch (error) {
      console.error(`Error fetching form fields in ${responseFormat} format:`, error);
      return {};
    }
  },
});
