import {
  createAction,
  Property,
  BasicAuthPropertyValue,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { generatebannersAuth } from '../auth';

export const renderTemplate = createAction({
  auth: generatebannersAuth,
  name: 'render_template',
  description: 'Render a GenerateBanners template',
  audience: 'both',
  aiMetadata: { description: 'Renders a GenerateBanners design template into an image or document and returns a signed URL to the generated file. Choose a template by id, pick the output file type (jpg, png, or pdf), and supply values for the template\'s variable fields to fill in dynamic text. Use this to produce banners, social posts, or PDFs from a predefined template. Read-only/idempotent: the same template id, file type, and variable values always yield the same rendered output with no extra side effect.', idempotent: true },
  displayName: 'Render Template',
  props: {
    template_id: Property.Dropdown({
      displayName: 'Template',
      auth: generatebannersAuth,
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const authentication = auth;
        if (!authentication) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter your API key first.',
          };
        }

        const response =
          await httpClient.sendRequest<GenerateBannersTemplateList>({
            method: HttpMethod.GET,
            url: `https://api.generatebanners.com/api/v1/${authentication.username}/template`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: authentication.password,
            },
          });

        if (response.status === 200) {
          return {
            disabled: false,
            options: response.body.templates.map((template) => {
              return {
                label: template.name,
                value: template.id,
              };
            }),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Error fetching templates',
        };
      },
    }),
    filetype: Property.StaticDropdown({
      displayName: 'File type',
      required: true,
      defaultValue: 'jpg',
      options: {
        options: [
          {
            label: 'Image (jpg)',
            value: 'jpg',
          },
          {
            label: 'Image (png)',
            value: 'png',
          },
          {
            label: 'Document (pdf)',
            value: 'pdf',
          },
        ],
      },
    }),
    variables: Property.DynamicProperties({
      displayName: 'Variables',
      auth: generatebannersAuth,
      required: true,
      refreshers: ['template_id'],
      props: async ({ auth, template_id }) => {
        if (!auth || !template_id) {
          return {};
        }
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `https://api.generatebanners.com/api/v1/${auth['username']}/template/${template_id}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth['password'],
          },
        };
        const result = await httpClient.sendRequest(request);
        if (result.status === 200) {
          // Allowing any because the properties are defined on GenerateBanners
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const properties: any = {};
          for (const variable of result.body['template']['variables']) {
            if (!variable.hidden) {
              switch (variable.property) {
                case 'text':
                  properties[variable.name] = Property.LongText({
                    displayName: variable.name,
                    required: false,
                  });
                  break;
                default:
                  properties[variable.name] = Property.ShortText({
                    displayName: variable.name,
                    required: false,
                  });
              }
            }
          }
          return properties;
        } else {
          return {};
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    // Build the querystring from the dynamic properties
    const query = [];
    if (propsValue.variables) {
      const props = Object.entries(propsValue.variables);
      for (const [propertyKey, propertyValue] of props) {
        if (propertyValue) {
          query.push(
            `${propertyKey}=${encodeURIComponent(propertyValue as string)}`
          );
        }
      }
    }
    // Get the signed url
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.generatebanners.com/api/v1/${auth.username}/template/${
        propsValue.template_id
      }/sign-url?filetype=${encodeURIComponent(
        propsValue.filetype
      )}&${query.join('&')}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.password,
      },
    };
    const result = await httpClient.sendRequest(request);
    if (result.status === 200 || result.status === 202) {
      // Return an url for more flexibility
      return result.body['url'];
    } else {
      return {};
    }
  },
});

interface GenerateBannersTemplateList {
  templates: GenerateBannersTemplate[];
}

interface GenerateBannersTemplate {
  id: string;
  name: string;
  variables: [];
}
