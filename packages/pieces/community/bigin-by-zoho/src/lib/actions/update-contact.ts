import { biginAuth } from '../../index';
import {
  createAction,
  Property,
  InputPropertyMap,
  PropertyContext,
} from '@activepieces/pieces-framework';
import { companyDropdown, tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';
import { handleDropdownError } from '../common/helpers';

export const updateContact = createAction({
  auth: biginAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Select and update an existing Contact record.',

  props: {
    contactId: Property.Dropdown({
      displayName: 'Select Contact',
      description: 'Choose a contact to update',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }: any) => {
        if (!auth) return handleDropdownError('Please connect first');
        const resp = await biginApiService.fetchContacts(
          auth.access_token,
          auth.api_domain
        );
        return {
          options: resp.data.map((c: any) => ({
            label: `${c.First_Name ?? ''} ${c.Last_Name}`.trim(),
            value: JSON.stringify(c),
          })),
        };
      },
    }),

    contactDetails: Property.DynamicProperties({
      displayName: 'Contact Fields',
      description: 'Edit any of these fields',
      refreshers: ['contactId', 'auth'],
      required: true,
      props: async (
        { contactId, auth }: any,
      ): Promise<InputPropertyMap> => {
        if (!contactId) return {};
        const contact = JSON.parse(contactId);
        const { access_token, api_domain } = auth as any;

        const [fieldsResp, usersResp, companiesResp] = await Promise.all([
          biginApiService.fetchModuleFields(access_token, api_domain, 'Contacts'),
          biginApiService.fetchUsers(access_token, api_domain),
          biginApiService.fetchCompanies(access_token, api_domain),
        ]);

        const usersOptions = (usersResp.users || []).map((u: any) => ({
          label: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
          value: u.id,
        }));
        const companyOptions = (companiesResp.data || []).map((c: any) => ({
          label: c.Account_Name,
          value: c.id,
        }));

        const props: InputPropertyMap = {};

        const fields = (fieldsResp.fields || []) as any[];
        for (const f of fields) {
          const apiName = f.api_name as string;

          if (f.read_only || f.field_read_only) continue;
          if (!f.view_type || f.view_type.edit !== true) continue;

          if (apiName === 'Tag') continue;
          if (apiName === 'id') continue;

          let defaultValue: any = contact[apiName] ?? undefined;
          if (apiName === 'Owner') defaultValue = contact.Owner?.id;
          if (apiName === 'Account_Name') defaultValue = contact.Account_Name?.id;

          switch ((f.data_type as string)?.toLowerCase()) {
            case 'picklist': {
              const options = (f.pick_list_values || []).map((pl: any) => ({
                label: pl.display_value,
                value: pl.actual_value,
              }));
              props[apiName] = Property.StaticDropdown({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
                options: { options },
              });
              break;
            }
            case 'multiselectpicklist': {
              const options = (f.pick_list_values || []).map((pl: any) => ({
                label: pl.display_value,
                value: pl.actual_value,
              }));
              props[apiName] = Property.StaticMultiSelectDropdown({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
                options: { options },
              });
              break;
            }
            case 'boolean': {
              props[apiName] = Property.Checkbox({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue: Boolean(defaultValue),
              });
              break;
            }
            case 'date': {
              props[apiName] = Property.ShortText({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
              });
              break;
            }
            case 'datetime': {
              props[apiName] = Property.DateTime({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
              });
              break;
            }
            case 'integer':
            case 'long':
            case 'double':
            case 'decimal':
            case 'currency':
            case 'percent': {
              props[apiName] = Property.Number({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
              });
              break;
            }
            default: {
              if (apiName === 'Owner') {
                props[apiName] = Property.StaticDropdown({
                  displayName: 'Owner',
                  description: f.tooltip || undefined,
                  required: false,
                  defaultValue,
                  options: { options: usersOptions },
                });
                break;
              }
              if (apiName === 'Account_Name') {
                props[apiName] = Property.StaticDropdown({
                  displayName: 'Company',
                  description: f.tooltip || undefined,
                  required: false,
                  defaultValue,
                  options: { options: companyOptions },
                });
                break;
              }
              if (apiName === 'Description') {
                props[apiName] = Property.LongText({
                  displayName: 'Description',
                  description: f.tooltip || undefined,
                  required: false,
                  defaultValue,
                });
                break;
              }

              props[apiName] = Property.ShortText({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined,
              });
            }
          }
        }

        return props;
      },
    }),

    accountName: companyDropdown,
    tag: tagsDropdown('Contacts'),
  },

  async run(context) {
   try {
     const { contactDetails, contactId, accountName, tag } = context.propsValue as any;

     const record: Record<string, any> = { id: JSON.parse(contactId).id };

     if (contactDetails && typeof contactDetails === 'object') {
       for (const [apiName, value] of Object.entries(contactDetails)) {
         if (
           value === undefined ||
           value === null ||
           (typeof value === 'string' && value.trim() === '') ||
           (Array.isArray(value) && (value as any[]).length === 0)
         ) {
           continue;
         }

         if (apiName === 'Owner' || apiName === 'Account_Name') {
           record[apiName] = { id: value };
         } else if (apiName === 'Tag') {
           record['Tag'] = (value as any[]).map((t: any) => ({ name: t }));
         } else {
           record[apiName] = value;
         }
       }
     }

     if (accountName) {
       record['Account_Name'] = { id: accountName };
     }
     if (tag && Array.isArray(tag) && tag.length > 0) {
       record['Tag'] = tag.map((t: any) => ({ name: t }));
     }

     const payload = { data: [record] };

     const resp = await biginApiService.updateContact(
       context.auth.access_token,
       (context.auth as any).api_domain,
       payload
     );

     return {
       message: 'Contact updated successfully',
       data: resp.data[0],
     };
   } catch (error: any) {
     console.error('Error updating contact:', error);
     throw new Error(
       error instanceof Error
         ? `Failed to update contact: ${error.message}`
         : 'Failed to update contact due to an unknown error'
     );
   }
  },
});
