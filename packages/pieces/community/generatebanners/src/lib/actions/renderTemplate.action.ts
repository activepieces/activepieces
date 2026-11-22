import {
  createAction,
  InputPropertyMap,
  MarkdownVariant,
  Property,
  tryCatch,
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
  classification: 'READ',
  description: 'Create an image or PDF from one of your templates.',
  audience: 'both',
  aiMetadata: { description: 'Renders a GenerateBanners design template into an image or document and returns a signed URL to the generated file. Choose a template by id, pick the output file type (jpg, png, or pdf), and supply values for the template\'s variable fields to fill in dynamic text. Use this to produce banners, social posts, or PDFs from a predefined template. Read-only/idempotent: the same template id, file type, and variable values always yield the same rendered output with no extra side effect.', idempotent: true },
  displayName: 'Render Template',
  props: {
    template_id: Property.Dropdown({
      displayName: 'Template',
      description: 'Its fields appear below once you pick one.',
      auth: generatebannersAuth,
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first.',
          };
        }

        const { data: response, error } = await tryCatch(() =>
          httpClient.sendRequest<GenerateBannersTemplateList>({
            method: HttpMethod.GET,
            url: `https://api.generatebanners.com/api/v1/${auth.username}/template`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth.password,
            },
          })
        );

        if (error || response.status !== 200) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Could not load templates. Check your connection.',
          };
        }

        if (response.body.templates.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No templates found. Create one in GenerateBanners first.',
          };
        }

        return {
          disabled: false,
          options: response.body.templates.map((template) => {
            return {
              label: template.name,
              value: template.id,
            };
          }),
        };
      },
    }),
    filetype: Property.StaticDropdown({
      displayName: 'File Type',
      required: true,
      defaultValue: 'jpg',
      display: 'cards',
      options: {
        options: [
          {
            label: 'JPG',
            value: 'jpg',
            description: 'Smaller image',
          },
          {
            label: 'PNG',
            value: 'png',
            description: 'Lossless image',
          },
          {
            label: 'PDF',
            value: 'pdf',
            description: 'Document',
          },
        ],
      },
    }),
    variables: Property.DynamicProperties({
      displayName: 'Template Fields',
      auth: generatebannersAuth,
      required: true,
      refreshers: ['template_id'],
      props: async ({ auth, template_id }) => {
        if (!auth || !template_id) {
          return {
            generatebanners_fields_info: Property.MarkDown({
              value: 'Pick a template to fill in its fields.',
              variant: MarkdownVariant.INFO,
            }),
          };
        }
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `https://api.generatebanners.com/api/v1/${auth['username']}/template/${template_id}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth['password'],
          },
        };
        const { data: result, error } = await tryCatch(() =>
          httpClient.sendRequest<GenerateBannersTemplateDetails>(request)
        );
        if (error) {
          return {
            generatebanners_fields_info: Property.MarkDown({
              value: 'Could not load template fields. Check your connection.',
              variant: MarkdownVariant.WARNING,
            }),
          };
        }
        if (result.status !== 200) {
          return {};
        }
        const visibleVariables = result.body.template.variables.filter(
          (variable) => !variable.hidden
        );
        if (visibleVariables.length === 0) {
          return {
            generatebanners_fields_info: Property.MarkDown({
              value: 'This template has no fields to fill in.',
              variant: MarkdownVariant.INFO,
            }),
          };
        }
        const properties: InputPropertyMap = {
          generatebanners_fields_info: Property.MarkDown({
            value: "Fields left empty keep the template's default values.",
            variant: MarkdownVariant.INFO,
          }),
        };
        for (const variable of visibleVariables) {
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
        return properties;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const query = [];
    if (propsValue.variables) {
      const props = Object.entries(propsValue.variables);
      for (const [propertyKey, propertyValue] of props) {
        if (propertyValue) {
          query.push(
            `${propertyKey}=${encodeURIComponent(String(propertyValue))}`
          );
        }
      }
    }
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
  variables: GenerateBannersTemplateVariable[];
}

interface GenerateBannersTemplateVariable {
  name: string;
  property: string;
  hidden?: boolean;
}

interface GenerateBannersTemplateDetails {
  template: {
    variables: GenerateBannersTemplateVariable[];
  };
}
