import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { SubscriberListFieldType } from './constants';
import {
  GetListsResponse,
  GetTemplatesResponse,
  SubscriberListField,
} from './types';
import { acumbamailAuth } from '../auth';

export const acumbamailCommon = {
  baseUrl: 'https://acumbamail.com/api/1',
  listId: Property.Dropdown({
    auth: acumbamailAuth,
    displayName: 'Subscriber List',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Acumbamail account first',
          options: [],
        };
      }

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: acumbamailCommon.baseUrl + '/getLists/',
        queryParams: { auth_token: auth.secret_text },
      };

      try {
        const res = await httpClient.sendRequest<GetListsResponse>(request);
        const options = Object.entries(res.body).map(([key, val]) => {
          return {
            value: Number(key),
            label: val.name,
          };
        });
        if (options.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No lists found. Create one first.',
          };
        }
        return {
          disabled: false,
          options,
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load lists. Check your connection.',
        };
      }
    },
  }),
  listMergeFields: Property.DynamicProperties({
    auth: acumbamailAuth,
    displayName: 'Merge Fields',
    refreshers: ['listId'],
    required: true,
    props: async ({ auth, listId }) => {
      if (!auth) return {};
      if (!listId) return {};

      const fields: DynamicPropsValue = {};

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: acumbamailCommon.baseUrl + '/getListFields/',
        queryParams: {
          auth_token: auth.secret_text,
          list_id: listId as unknown as string,
        },
      };

      const res = await httpClient.sendRequest<{
        fields: SubscriberListField[];
      }>(request);

      for (const field of res.body.fields) {
        switch (field.type) {
          case SubscriberListFieldType.CHECKBOX:
            fields[field.tag] = Property.Checkbox({
              displayName: field.label,
              required: false,
            });
            break;
          case SubscriberListFieldType.DATE:
            fields[field.tag] = Property.DateTime({
              displayName: field.label,
              required: false,
            });
            break;
          case SubscriberListFieldType.EMAIL:
            fields[field.tag] = Property.ShortText({
              displayName: field.label,
              required: true,
            });
            break;
          case SubscriberListFieldType.TEXT:
          case SubscriberListFieldType.IP:
          case SubscriberListFieldType.URL:
            fields[field.tag] = Property.ShortText({
              displayName: field.label,
              required: false,
            });
            break;
          case SubscriberListFieldType.DECIMAL:
          case SubscriberListFieldType.WHOLE_NUMBER:
            fields[field.tag] = Property.Number({
              displayName: field.label,
              required: false,
            });
            break;
          case SubscriberListFieldType.LONG_TEXT:
            fields[field.tag] = Property.LongText({
              displayName: field.label,
              required: false,
            });
            break;
          case SubscriberListFieldType.LIST:
            fields[field.tag] = Property.StaticDropdown({
              displayName: field.label,
              required: false,
              options: {
                disabled: false,
                options: field.options
                  ? field.options.map((option) => {
                      return {
                        label: option.label,
                        value: option.label,
                      };
                    })
                  : [],
              },
            });
            break;
          default:
            break;
        }
      }
      return fields;
    },
  }),
  templateId: Property.Dropdown({
    auth: acumbamailAuth,
    displayName: 'Template',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Acumbamail account first',
          options: [],
        };
      }

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: acumbamailCommon.baseUrl + '/getTemplates/',
        queryParams: { auth_token: auth.secret_text },
      };

      try {
        const res = await httpClient.sendRequest<GetTemplatesResponse[]>(
          request
        );
        const options = res.body.map((template) => {
          return {
            label: template.name,
            value: template.id,
          };
        });
        if (options.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No templates found. Create one first.',
          };
        }
        return {
          disabled: false,
          options,
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load templates. Check your connection.',
        };
      }
    },
  }),
};
