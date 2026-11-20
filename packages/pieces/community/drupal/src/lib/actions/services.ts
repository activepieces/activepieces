import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { drupalAuth } from '../auth';

export const drupalCallServiceAction = createAction({
  auth: drupalAuth,
  name: 'drupal-call-service',
  classification: 'WRITE',
  displayName: 'Call Service',
  description: 'Run a service exposed by the Drupal Orchestration module.',
  audience: 'both',
  aiMetadata: { description: 'Executes a named server-side service (e.g. an ECA/orchestration action) exposed by the Drupal site, passing a dynamic configuration object whose fields are defined by the chosen service. Use to invoke custom Drupal-side logic that has no dedicated action here. The service must be discoverable via the site\'s orchestration endpoint; because it runs arbitrary server logic, treat each call as potentially side-effecting and not idempotent.', idempotent: false },
  propertyGroups: [
    { key: 'service', display: 'section', label: 'Service to Run', icon: 'code', props: ['requirements', 'service'] },
    { key: 'settings', display: 'section', label: 'Service Settings', icon: 'sliders', props: ['config'] },
  ],
  props: {
    requirements: Property.MarkDown({
      value: 'Needs the [Drupal Orchestration](https://www.drupal.org/project/orchestration) module on your site.',
      variant: MarkdownVariant.INFO,
    }),
    service: Property.Dropdown({
      displayName: 'Service',
      description: 'A service your site exposes through Orchestration.',
      required: true,
      refreshers: [],
      auth: drupalAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your Drupal account first',
          };
        }
        const { website_url, username, password } = auth.props;


        try {
          const response = await httpClient.sendRequest<DrupalService[]>({
            method: HttpMethod.GET,
            url: website_url + `/orchestration/services`,
            headers: {
              'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
              'Accept': 'application/vnd.api+json',
            },
          });
          if (response.status === 200 && response.body.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No services found on your site.',
            };
          }
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
          placeholder: 'Could not load services from your site',
        };
      },
    }),
    config: Property.DynamicProperties({
      displayName: 'Configuration',
      description: 'Fields depend on the service you pick.',
      refreshers: ['service'],
      required: true,
      auth: drupalAuth,
      props: async ({ service }) => {
        const fields: Record<string, any> = {};
        if (!service) {
          return {};
        }
        const items = (service as { config: DrupalServiceConfig[] }).config;
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
                }))
              },
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
        return fields;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { website_url, username, password } = auth.props;
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
