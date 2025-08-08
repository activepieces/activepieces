import {
  createAction,
  OAuth2PropertyValue,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { formIdDropdown } from '../common/props';
import { formStackAuth } from '../common/auth';
import { makeFormRequest, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createSubmission = createAction({
  auth: formStackAuth,
  name: 'createSubmission',
  displayName: 'Create Submission',
  description: 'Submit data to a Formstack form',
  props: {
    form_id: formIdDropdown,
    user_agent: Property.ShortText({
      displayName: 'User Agent',
      description: 'Browser user agent to record',
      required: false,
    }),
    remote_addr: Property.ShortText({
      displayName: 'IP Address',
      description: 'IP address to record',
      required: false,
    }),
    payment_status: Property.ShortText({
      displayName: 'Payment Status',
      description: 'Payment integration status',
      required: false,
    }),
    read: Property.Checkbox({
      displayName: 'Mark as Read',
      description: 'Mark submission as read when created',
      defaultValue: false,
      required: false,
    }),
    encryption_password: Property.ShortText({
      displayName: 'Encryption Password',
      description: 'Password for encrypted forms',
      required: false,
    }),
    form_fields: Property.DynamicProperties({
      displayName: 'Form Fields',
      description: 'Fill out the form fields',
      required: true,
      refreshers: ['form_id'],
      props: async ({ auth, form_id }) => {
        if (!auth || !form_id) {
          return {};
        }

        const authentication = auth as OAuth2PropertyValue;
        const accessToken = authentication['access_token'];

        try {
          const formDetails = await makeRequest(
            accessToken,
            HttpMethod.GET,
            `/form/${form_id}.json`
          );

          const fields: Record<string, any> = {};

          if (formDetails?.fields) {
            for (const field of formDetails.fields) {
              const fieldKey = `field_${field.id}`;
              const isRequired = field.required === '1' || field.required === 1;
              
              const fieldLabel = field.label || field.name || field.title || `Field ${field.id}`;
              
              if (field.type?.toLowerCase() === 'section') {
                continue;
              }
              
              switch (field.type?.toLowerCase()) {
                case 'select':
                case 'radio':
                case 'checkbox':{
                  const optionsData = field.options || field.choices || field.option_choices;
                  
                  if (optionsData) {
                    let options: Array<{ label: string; value: string }> = [];
                    
                    if (typeof optionsData === 'string') {
                      options = optionsData.split('\n').filter(opt => opt.trim()).map((option: string) => ({
                        label: option.trim(),
                        value: option.trim(),
                      }));
                    } else if (Array.isArray(optionsData)) {
                      options = optionsData.map((option: any) => {
                        if (typeof option === 'string') {
                          return { label: option, value: option };
                        } else if (option && typeof option === 'object') {
                          const label = option.label || option.text || option.option || option.value;
                          const value = option.value || option.label || option.text || option.option;
                          
                          if (label && value) {
                            return { label: String(label), value: String(value) };
                          }
                          return null;
                        }
                        return { label: String(option), value: String(option) };
                      }).filter((opt: any): opt is { label: string; value: string } => opt !== null && opt.label && opt.value);
                    } else if (typeof optionsData === 'object') {
                      options = Object.entries(optionsData).map(([key, value]) => ({
                        label: String(value),
                        value: key,
                      }));
                    }
                    
                    if (options.length > 0) {
                      if (field.type?.toLowerCase() === 'checkbox') {
                        fields[fieldKey] = Property.StaticMultiSelectDropdown({
                          displayName: fieldLabel,
                          description: field.description || undefined,
                          required: isRequired,
                          options: {
                            options,
                          },
                        });
                      } else {
                        fields[fieldKey] = Property.StaticDropdown({
                          displayName: fieldLabel,
                          description: field.description || undefined,
                          required: isRequired,
                          options: {
                            options,
                          },
                        });
                      }
                    } else {
                      fields[fieldKey] = Property.ShortText({
                        displayName: fieldLabel,
                        description: field.description || undefined,
                        required: isRequired,
                        defaultValue: field.default || undefined,
                      });
                    }
                  } else {
                    fields[fieldKey] = Property.ShortText({
                      displayName: fieldLabel,
                      description: field.description || undefined,
                      required: isRequired,
                      defaultValue: field.default || undefined,
                    });
                  }
                  break;
                }
                case 'text':
                  fields[fieldKey] = Property.ShortText({
                    displayName: fieldLabel,
                    description: field.description || undefined,
                    required: isRequired,
                    defaultValue: field.default || undefined,
                  });
                  break;

                case 'textarea':
                case 'richtext':
                  fields[fieldKey] = Property.LongText({
                    displayName: fieldLabel,
                    description: field.description || undefined,
                    required: isRequired,
                    defaultValue: field.default || undefined,
                  });
                  break;

                case 'email':
                  fields[fieldKey] = Property.ShortText({
                    displayName: fieldLabel,
                    description: field.description || undefined,
                    required: isRequired,
                    defaultValue: field.default || undefined,
                  });
                  break;

                case 'phone':
                  fields[fieldKey] = Property.ShortText({
                    displayName: fieldLabel,
                    description: field.description ? `${field.description} (Format: (XXX) XXX-XXXX)` : 'Phone number (Format: (XXX) XXX-XXXX)',
                    required: isRequired,
                    defaultValue: field.default || undefined,
                  });
                  break;

                case 'number':
                  fields[fieldKey] = Property.Number({
                    displayName: fieldLabel,
                    description: field.description || undefined,
                    required: isRequired,
                    defaultValue: field.default ? Number(field.default) : undefined,
                  });
                  break;

                case 'creditcard':
                  fields[fieldKey] = Property.ShortText({
                    displayName: fieldLabel,
                    description: field.description || 'Credit card number',
                    required: isRequired,
                  });
                  break;

                case 'datetime':
                  fields[fieldKey] = Property.DateTime({
                    displayName: fieldLabel,
                    description: field.description || undefined,
                    required: isRequired,
                  });
                  break;
                case 'file':
                  fields[fieldKey] = Property.File({
                    displayName: fieldLabel,
                    description: field.description ? `${field.description} (File will be base64 encoded automatically)` : 'Upload a file (will be base64 encoded automatically)',
                    required: isRequired,
                  });
                  break;

                case 'name':{
                  const nameSubfields = field.visible_subfields || ['first', 'last'];
                  
                  if (nameSubfields.includes('prefix')) {
                    fields[`${fieldKey}[prefix]`] = Property.ShortText({
                      displayName: `${fieldLabel} - Prefix`,
                      description: 'Title (Mr., Mrs., Dr., etc.)',
                      required: false,
                    });
                  }
                  
                  if (nameSubfields.includes('first')) {
                    fields[`${fieldKey}[first]`] = Property.ShortText({
                      displayName: `${fieldLabel} - First Name`,
                      description: 'First name',
                      required: isRequired,
                    });
                  }

                  if (nameSubfields.includes('middle')) {
                    fields[`${fieldKey}[middle]`] = Property.ShortText({
                      displayName: `${fieldLabel} - Middle Name`,
                      description: 'Middle name',
                      required: false,
                    });
                  }

                  if (nameSubfields.includes('initial')) {
                    fields[`${fieldKey}[initial]`] = Property.ShortText({
                      displayName: `${fieldLabel} - Middle Initial`,
                      description: 'Middle initial',
                      required: false,
                    });
                  }

                  if (nameSubfields.includes('last')) {
                    fields[`${fieldKey}[last]`] = Property.ShortText({
                      displayName: `${fieldLabel} - Last Name`,
                      description: 'Last name',
                      required: isRequired,
                    });
                  }

                  if (nameSubfields.includes('suffix')) {
                    fields[`${fieldKey}[suffix]`] = Property.ShortText({
                      displayName: `${fieldLabel} - Suffix`,
                      description: 'Suffix (Jr., Sr., III, etc.)',
                      required: false,
                    });
                  }
                  break;
                }
                case 'address': {
                  const addressSubfields = field.visible_subfields || ['address', 'city', 'state', 'zip'];
                  
                  if (addressSubfields.includes('address')) {
                    fields[`${fieldKey}[address]`] = Property.ShortText({
                      displayName: `${fieldLabel} - Address Line 1`,
                      description: 'Street address',
                      required: isRequired,
                    });
                  }

                  if (addressSubfields.includes('address2')) {
                    fields[`${fieldKey}[address2]`] = Property.ShortText({
                      displayName: `${fieldLabel} - Address Line 2`,
                      description: 'Apartment, suite, etc.',
                      required: false,
                    });
                  }

                  if (addressSubfields.includes('city')) {
                    fields[`${fieldKey}[city]`] = Property.ShortText({
                      displayName: `${fieldLabel} - City`,
                      description: 'City',
                      required: isRequired,
                    });
                  }

                  if (addressSubfields.includes('state')) {
                    fields[`${fieldKey}[state]`] = Property.ShortText({
                      displayName: `${fieldLabel} - State`,
                      description: 'State/Province',
                      required: isRequired,
                    });
                  }

                  if (addressSubfields.includes('zip')) {
                    fields[`${fieldKey}[zip]`] = Property.ShortText({
                      displayName: `${fieldLabel} - ZIP Code`,
                      description: 'ZIP/Postal code',
                      required: isRequired,
                    });
                  }

                  if (addressSubfields.includes('country')) {
                    fields[`${fieldKey}[country]`] = Property.ShortText({
                      displayName: `${fieldLabel} - Country`,
                      description: 'Country',
                      required: false,
                    });
                  }
                  break;
                }


                default:
                  fields[fieldKey] = Property.ShortText({
                    displayName: fieldLabel,
                    description: field.description || field.hint || undefined,
                    required: isRequired,
                    defaultValue: field.default || field.defaultValue || undefined,
                  });
                  break;
              }
            }
          }

          return fields;
        } catch (error) {
          return {};
        }
      },
    }),
  },

  async run(context) {
    const authentication = context.auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];
    
    const {
      form_id,
      user_agent,
      remote_addr,
      payment_status,
      read,
      encryption_password,
      form_fields,
    } = context.propsValue;

    const formData: Record<string, any> = {};

    if (form_fields) {
      for (const [key, value] of Object.entries(form_fields as DynamicPropsValue)) {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object' && value.base64) {
            const filename = value.filename || 'upload.file';
            formData[key] = `${filename};${value.base64}`;
          } else if (Array.isArray(value)) {
            formData[key] = value.join(',');
          } else {
            let processedValue = value;
            
            if (key.includes('phone') || key.includes('Phone')) {
              const phoneStr = String(value);
              const digits = phoneStr.replace(/\D/g, '');
              if (digits.length === 10) {
                processedValue = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
              } else if (digits.length === 11 && digits[0] === '1') {
                processedValue = `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
              } else {
                processedValue = phoneStr;
              }
            }
            
            if (typeof value === 'string' && value.includes('T') && value.includes(':')) {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                processedValue = date.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
              }
            }
            
            formData[key] = processedValue;
          }
        }
      }
    }

    if (user_agent) formData['user_agent'] = user_agent;
    if (remote_addr) formData['remote_addr'] = remote_addr;
    if (payment_status) formData['payment_status'] = payment_status;
    if (read !== undefined) formData['read'] = read;
    if (encryption_password) formData['encryption_password'] = encryption_password;

    const response = await makeFormRequest(
      accessToken,
      HttpMethod.POST,
      `/form/${form_id}/submission`,
      formData
    );

    return {
      success: true,
      submission_id: response.id,
      message: 'Submission created successfully',
      details: response,
    };
  },
});
