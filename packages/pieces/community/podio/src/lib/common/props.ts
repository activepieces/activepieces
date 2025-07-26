import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioApiCall } from './client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const appIdDropdown = (displayName: string, required: boolean = true) => {
  return Property.Dropdown({
    displayName,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Podio account first',
          options: [],
        };
      }

      try {
        const authValue = auth as OAuth2PropertyValue;
        const apps = await podioApiCall<Array<{ app_id: number; config: { name: string } }>>({
          auth: authValue,
          method: HttpMethod.GET,
          resourceUri: '/app/v2/',
        });

        return {
          options: apps.map((app) => ({
            label: app.config.name,
            value: app.app_id.toString(),
          })),
        };
      } catch (error) {
        console.error('Error fetching apps:', error);
        return {
          disabled: true,
          placeholder: 'Error loading apps',
          options: [],
        };
      }
    },
  });
};

export const workspaceIdDropdown = (displayName: string, required: boolean = true) => {
  return Property.Dropdown({
    displayName,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Podio account first',
          options: [],
        };
      }

      try {
        const authValue = auth as OAuth2PropertyValue;
        const spaces = await podioApiCall<Array<{ space_id: number; name: string }>>({
          auth: authValue,
          method: HttpMethod.GET,
          resourceUri: '/space/',
        });

        return {
          options: spaces.map((space) => ({
            label: space.name,
            value: space.space_id.toString(),
          })),
        };
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        return {
          disabled: true,
          placeholder: 'Error loading workspaces',
          options: [],
        };
      }
    },
  });
};

export const organizationIdDropdown = (displayName: string, required: boolean = true) => {
  return Property.Dropdown({
    displayName,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Podio account first',
          options: [],
        };
      }

      try {
        const authValue = auth as OAuth2PropertyValue;
        const orgs = await podioApiCall<Array<{ org_id: number; name: string }>>({
          auth: authValue,
          method: HttpMethod.GET,
          resourceUri: '/org/',
        });

        return {
          options: orgs.map((org) => ({
            label: org.name,
            value: org.org_id.toString(),
          })),
        };
      } catch (error) {
        console.error('Error fetching organizations:', error);
        return {
          disabled: true,
          placeholder: 'Error loading organizations',
          options: [],
        };
      }
    },
  });
};

export const itemFields = () => {
  return Property.DynamicProperties({
    displayName: 'Item Fields',
    required: true,
    refreshers: ['appId'],
    props: async ({ auth, appId }) => {
      if (!auth || !appId) {
        return {};
      }

      const fields: DynamicPropsValue = {};

      try {
        const authValue = auth as OAuth2PropertyValue;
        const app = await podioApiCall<{ fields: Array<{ field_id: number; label: string; type: string; config: any }> }>({
          auth: authValue,
          method: HttpMethod.GET,
          resourceUri: `/app/${appId}`,
        });

        app.fields?.forEach((field) => {
          const fieldKey = `field_${field.field_id}`;
          
          switch (field.type) {
            case 'text':
            case 'email':
            case 'phone':
              fields[fieldKey] = Property.ShortText({
                displayName: field.label,
                required: false,
              });
              break;
            case 'number':
              fields[fieldKey] = Property.Number({
                displayName: field.label,
                required: false,
              });
              break;
            case 'date':
            case 'datetime':
              fields[fieldKey] = Property.DateTime({
                displayName: field.label,
                required: false,
              });
              break;
            case 'category':
              if (field.config?.settings?.options) {
                fields[fieldKey] = Property.StaticDropdown({
                  displayName: field.label,
                  required: false,
                  options: {
                    options: field.config.settings.options.map((option: any) => ({
                      label: option.text,
                      value: option.id.toString(),
                    })),
                  },
                });
              }
              break;
            case 'app':
              fields[fieldKey] = Property.ShortText({
                displayName: `${field.label} (Item ID)`,
                required: false,
                description: 'Enter the ID of the related item',
              });
              break;
            default:
              fields[fieldKey] = Property.LongText({
                displayName: field.label,
                required: false,
              });
          }
        });
      } catch (error) {
        console.error('Error fetching app fields:', error);
      }

      return fields;
    },
  });
};