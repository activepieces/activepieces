import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  CheckboxProperty,
  DateTimeProperty,
  FileProperty,
  LongTextProperty,
  NumberProperty,
  OAuth2PropertyValue,
  Property,
  ShortTextProperty,
} from '@activepieces/pieces-framework';
import { hubSpotClient } from './client';

enum HubspotFieldType {
  BooleanCheckBox = 'booleancheckbox',
  Date = 'date',
  File = 'file',
  Number = 'number',
  CalculationEquation = 'calculation_equation',
  PhoneNumber = 'phonenumber',
  Text = 'text',
  TextArea = 'textarea',
  Html = 'html',
  CheckBox = 'checkbox',
  Select = 'select',
  Radio = 'radio',
}

interface ContactProperty {
  name: string;
  label: string;
  description: string;
  type: string;
  fieldType: HubspotFieldType;
  options: [];
}

type DynamicPropsValue =
  | ShortTextProperty<boolean>
  | LongTextProperty<boolean>
  | CheckboxProperty<boolean>
  | DateTimeProperty<boolean>
  | FileProperty<boolean>
  | NumberProperty<boolean>;

export const hubspotCommon = {
  choose_props: Property.MultiSelectDropdown({
    displayName: 'Properties',
    description: 'Choose extra properties to add to the contact',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      const connection = auth as OAuth2PropertyValue;
      if (!connection) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'please authenticate your account first before selecting properties',
        };
      }
      try {
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.hubapi.com/properties/v1/contacts/properties',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: connection.access_token,
          },
        };
        const result = await httpClient.sendRequest(request);

        const properties = result.body.map((property: any) => {
          return {
            label: property.label,
            value: property,
          };
        });

        return {
          disabled: false,
          options: properties,
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'An error occurred while fetching properties',
        };
      }
    },
  }),
  dynamicProperties: Property.DynamicProperties({
    displayName: 'Dynamic Properties',
    description: 'Extra properties to add to the contact',
    required: false,
    refreshers: ['choose_props'],
    props: async ({ auth, choose_props }) => {
      const all_props = choose_props as ContactProperty[];

      if (!all_props) {
        return {};
      }

      const fields: any = {};

      for (const prop of all_props) {
        switch (prop.fieldType) {
          case HubspotFieldType.BooleanCheckBox:
            fields[prop.name] = Property.Checkbox({
              displayName: prop.label,
              description: prop.description,
              required: false,
            });
            break;
          case HubspotFieldType.Date:
            fields[prop.name] = Property.DateTime({
              displayName: prop.label,
              description: prop.description,
              required: false,
            });
            break;
          case HubspotFieldType.File:
            fields[prop.name] = Property.File({
              displayName: prop.label,
              description: prop.description,
              required: false,
            });
            break;
          case HubspotFieldType.Number:
            fields[prop.name] = Property.Number({
              displayName: prop.label,
              description: prop.description,
              required: false,
            });
            break;
          case HubspotFieldType.CalculationEquation:
          case HubspotFieldType.PhoneNumber:
          case HubspotFieldType.Text:
            fields[prop.name] = Property.ShortText({
              displayName: prop.label,
              description: prop.description,
              required: false,
            });
            break;
          case HubspotFieldType.TextArea:
          case HubspotFieldType.Html:
            fields[prop.name] = Property.LongText({
              displayName: prop.label,
              description: prop.description,
              required: false,
            });
            break;
          case HubspotFieldType.CheckBox:
            fields[prop.name] = Property.StaticMultiSelectDropdown({
              displayName: prop.label,
              description: prop.description,
              required: false,
              options: {
                options: prop.options.map((option: any) => {
                  return {
                    label: option.label,
                    value: option.value,
                  };
                }),
              },
            });
            break;
          case HubspotFieldType.Select:
          case HubspotFieldType.Radio:
            if (prop.name === 'hubspot_owner_id') {
              try {
                const res =
                  (
                    await hubSpotClient.listContactOwners(
                      auth.access_token as string
                    )
                  ).results ?? [];
                fields[prop.name] = Property.StaticDropdown({
                  displayName: prop.label,
                  description: prop.description,
                  required: false,
                  options: {
                    options: res.map((owner: { id: string; email: string }) => {
                      return {
                        label: owner.email,
                        value: owner.id,
                      };
                    }),
                  },
                });
              } catch (error) {
                return {
                  disabled: true,
                  options: [],
                  placeholder:
                    'An error occurred while fetching contact owner list.',
                };
              }
            } else {
              fields[prop.name] = Property.StaticDropdown({
                displayName: prop.label,
                description: prop.description,
                required: false,
                options: {
                  options: prop.options.map((option: any) => {
                    return {
                      label: option.label,
                      value: option.value,
                    };
                  }),
                },
              });
            }
            break;
        }
      }

      return fields;
    },
  }),
};
