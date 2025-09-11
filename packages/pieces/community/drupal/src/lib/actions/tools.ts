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

export const drupalCallToolAction = createAction({
  auth: drupalAuth,
  name: 'drupal-call-tool',
  displayName: 'Call Tool',
  description: 'Call a tool on the Drupal site',
  props: {
    tool: Property.Dropdown({
      displayName: 'Tool',
      description: 'The tool to call.',
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
          const response = await httpClient.sendRequest<DrupalTool[]>({
            method: HttpMethod.GET,
            url: website_url + `/orchestration/tools`,
            headers: {
              'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
              'Accept': 'application/vnd.api+json',
            },
          });
          console.debug('Tool response', response);
          if (response.status === 200) {
            return {
              disabled: false,
              options: response.body.map((tool) => {
                return {
                  label: tool.label,
                  description: tool.description,
                  value: tool,
                };
              }),
            };
          }
        } catch (e: any) {
          console.debug('Tool error', e);
        }
        return {
          disabled: true,
          options: [],
          placeholder: 'Error processing tools',
        };
      },
    }),
    config: Property.DynamicProperties({
      displayName: 'Tool configuration',
      refreshers: ['tool'],
      required: true,
      props: async ({ tool }) => {
        console.debug('Tool config input', tool);
        const fields: Record<string, any> = {};
        const items = tool['config'] as DrupalToolConfig[];
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
        console.debug('Field for this tool', fields);
        return fields;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { website_url, username, password } = (auth as DrupalAuthType);
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: website_url + `/orchestration/tool/execute`,
      body: {
        id: propsValue.tool.id,
        config: propsValue.config,
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Accept': 'application/vnd.api+json',
      },
    };

    const result = await httpClient.sendRequest<DrupalTool>(request);
    console.debug('Tool call completed', result);

    if (result.status === 200 || result.status === 202) {
      return result.body;
    } else {
      return result;
    }
  },
});

interface DrupalTool {
  id: string;
  label: string;
  description: string;
  config: DrupalToolConfig[];
}

interface DrupalToolConfig {
  key: string;
  label: string;
  description: string;
  required: boolean;
  type: string;
  default_value: string;
  options: string[];
  editable: boolean;
}
