import { biginAuth } from '../../index';
import {
  createAction,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';
import { handleDropdownError } from '../common/helpers';

export const updateCompany = createAction({
  auth: biginAuth,
  name: 'updateCompany',
  displayName: 'Update Company',
  description:
    'Updates an existing Company and prepopulates its fields for editing.',
  props: {
    companyId: Property.Dropdown({
      displayName: 'Select Company',
      description: 'Choose a company to update',
      required: true,
      refreshers: ['auth'],
      options: async (context: any) => {
        if (!context.auth)
          return handleDropdownError('Please connect your account first');

        const response = await biginApiService.fetchCompanies(
          context.auth.access_token,
          (context.auth as any).api_domain
        );

        return {
          options: response.data.map((company: any) => ({
            label: company.Account_Name,
            value: JSON.stringify(company),
          })),
        };
      },
    }),
    owner: usersDropdown,
    companyDetails: Property.DynamicProperties({
      displayName: 'Company Details',
      description: 'These fields will be prepopulated with company data',
      refreshers: ['companyId', 'auth'],
      required: true,
      props: async ({ companyId, auth }: any): Promise<InputPropertyMap> => {
        if (!companyId) return {};
        const company = JSON.parse(companyId);
        const { access_token, api_domain } = auth as any;

        const [fieldsResp, usersResp] = await Promise.all([
          biginApiService.fetchModuleFields(access_token, api_domain, 'Accounts'),
          biginApiService.fetchUsers(access_token, api_domain),
        ]);

        const usersOptions = (usersResp.users || []).map((u: any) => ({
          label: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
          value: u.id,
        }));

        const props: InputPropertyMap = {};
        const fields = (fieldsResp.fields || []) as any[];
        for (const f of fields) {
          const apiName = f.api_name as string;

          if (f.read_only || f.field_read_only) continue;
          if (!f.view_type || f.view_type.edit !== true) continue;
          if (apiName === 'Tag' || apiName === 'id') continue;

          let defaultValue: any = company[apiName] ?? undefined;
          if (apiName === 'Owner') defaultValue = company.Owner?.id;

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
    tag: tagsDropdown('Accounts'),
  },

  async run(context) {
    try {
      const company = JSON.parse(context.propsValue.companyId);
      const companyId = company.id;
      const updates = context.propsValue.companyDetails as Record<string, any>;

      const body: Record<string, any> = { id: companyId };

      for (const [apiName, value] of Object.entries(updates || {})) {
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          continue;
        }
        if (apiName === 'Owner') {
          body['Owner'] = { id: value };
        } else if (apiName === 'Tag') {
          body['Tag'] = (value as any[]).map((t: any) => ({ name: t }));
        } else {
          body[apiName] = value;
        }
      }

      if (context.propsValue.owner) {
        body['Owner'] = { id: context.propsValue.owner };
      }
      if (
        context.propsValue.tag &&
        Array.isArray(context.propsValue.tag) &&
        context.propsValue.tag.length > 0
      ) {
        body['Tag'] = context.propsValue.tag.map((t: any) => ({ name: t }));
      }

      const response = await biginApiService.updateCompany(
        context.auth.access_token,
        (context.auth as any).api_domain,
        { data: [body] }
      );

      return {
        message: 'Company updated successfully',
        data: response.data[0],
      };
    } catch (error: any) {
      console.error('Error updating company:', error);
      throw new Error(error);
    }
  },
});
