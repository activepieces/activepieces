import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { drupalAuth } from '../../';
type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export const drupalCallServiceAction = createAction({
  auth: drupalAuth,
  name: 'drupal-call-service',
  displayName: 'Call Service',
  description: 'Call a service on the Drupal site',
  props: {
    service: Property.Dropdown({
      displayName: 'Service',
      description: 'The service to call.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const { website_url, username, password } = (auth as DrupalAuthType);
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first.',
          };
        }

        try {
          const response = await httpClient.sendRequest<DrupalService[]>({
            method: HttpMethod.GET,
            url: website_url + `/orchestration/services`,
            headers: {
              'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
              'Accept': 'application/vnd.api+json',
            },
          });
          console.debug('Service response', response);
          if (response.status === 200) {
            return {
              disabled: false,
              options: response.body.map((service) => {
                return {
                  label: service.label,
                  description: service.description,
                  value: service,
                };
              }),
            };
          }
        } catch (e: any) {
          console.debug('Service error', e);
        }
        return {
          disabled: true,
          options: [],
          placeholder: 'Error processing services',
        };
      },
    }),
    config: Property.DynamicProperties({
      displayName: 'Service configuration',
      refreshers: ['service'],
      required: true,
      props: async ({ service }) => {
        console.debug('Service config input', service);
        const fields: Record<string, any> = {};
        const items = service['config'] as DrupalServiceConfig[];
        items.forEach((config: any) => {
          if (config.type === 'boolean') {
            fields[config.key] = Property.Checkbox({
              displayName: config.label,
              description: config.description,
              required: config.required,
              defaultValue: config.default_value,
            });
          } else if (config.type === 'integer' || config.type === 'float') {
            fields[config.key] = Property.Number({
              displayName: config.label,
              description: config.description,
              required: config.required,
              defaultValue: config.default_value,
            });
          } else if (config.type === 'timestamp' || config.type === 'datetime_iso8601') {
            fields[config.key] = Property.DateTime({
              displayName: config.label,
              description: config.description,
              required: config.required,
              defaultValue: config.default_value,
            });
          } else if (config.options.length > 0) {
            fields[config.key] = Property.StaticDropdown({
              displayName: config.label,
              description: config.description,
              required: config.required,
              defaultValue: config.default_value,
              options: {
                options: config.options.map((option: any) => ({
                  label: option.name,
                  value: option.key,
                }))},
            });
          } else {

            fields[config.key] = Property.ShortText({
              displayName: config.label,
              description: config.description,
              required: config.required,
              defaultValue: config.default_value,
            });
          }
        });
        console.debug('Field for this service', fields);
        return fields;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { website_url, username, password } = (auth as DrupalAuthType);
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: website_url + `/orchestration/service/execute`,
      body: {
        id: propsValue.service.id,
        config: propsValue.config,
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Accept': 'application/vnd.api+json',
      },
    };

    const result = await httpClient.sendRequest<DrupalService>(request);
    console.debug('Service call completed', result);

    if (result.status === 200 || result.status === 202) {
      return result.body;
    } else {
      return result;
    }
  },
});

interface DrupalService {
  id: string;
  label: string;
  description: string;
  config: DrupalServiceConfig[];
}

interface DrupalServiceConfig {
  key: string;
  label: string;
  description: string;
  required: boolean;
  type: string;
  default_value: string;
  options: string[];
  editable: boolean;
}
