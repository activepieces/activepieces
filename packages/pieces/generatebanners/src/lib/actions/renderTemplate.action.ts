import {
  createAction,
  Property,
  AuthenticationType,
  HttpRequest,
  HttpMethod,
  httpClient,
  BasicAuthPropertyValue,
} from '@activepieces/framework';

const markdownDescription = `
To obtain your GenerateBanners public and secret API Keys, you can follow the steps below:

1. Go to the [GenerateBanners homepage](https://www.generatebanners.com/).
2. Sign up or log in into your account.
3. Go to your [account page](https://www.generatebanners.com/app/account).
4. The public and secret API keys are now displayed, copy them one by one into the right Activepieces fields.
`;

export const renderTemplate = createAction({
  name: 'render_template',
  description: 'Render a GenerateBanners template',
  displayName: 'Render Template',
  props: {
    authentication: Property.BasicAuth({
      displayName: 'API Key',
      description: markdownDescription,
      required: true,
      username: {
        displayName: 'Public API Key',
      },
      password: {
        displayName: 'Secret API Key',
      },
    }),
    template_id: Property.Dropdown({
      displayName: 'Template',
      required: true,
      refreshers: ['authentication'],
      options: async ({ authentication }) => {
        const auth = authentication as BasicAuthPropertyValue;
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter your API key first.',
          };
        }

        const response =
          await httpClient.sendRequest<GenerateBannersTemplateList>({
            method: HttpMethod.GET,
            url: `https://api.generatebanners.com/api/v1/${auth['username']}/template`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth['password'],
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
          {
            label: 'Video (mp4)',
            value: 'mp4',
          },
        ],
      },
    }),
    audio_url: Property.ShortText({
      displayName: 'Audio url',
      description: 'Link to an audio file. Only used for videos.',
      required: false,
    }),
    variables: Property.DynamicProperties({
      displayName: 'Variables',
      required: true,
      refreshers: ['authentication', 'template_id'],
      props: async ({ authentication, template_id }) => {
        if (!authentication || !template_id) {
          return {};
        }
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `https://api.generatebanners.com/api/v1/${authentication['username']}/template/${template_id}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authentication['password'],
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
  async run({ propsValue }) {
    // Build the querystring from the dynamic properties
    const query = [];
    if (propsValue.variables) {
      const props = Object.entries(propsValue.variables);
      for (const [propertyKey, propertyValue] of props) {
        if (propertyValue) {
          query.push(`${propertyKey}=${encodeURIComponent(propertyValue)}`);
        }
      }
    }
    // Get the signed url
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.generatebanners.com/api/v1/${
        propsValue.authentication.username
      }/template/${
        propsValue.template_id
      }/sign-url?filetype=${encodeURIComponent(
        propsValue.filetype
      )}&audioUrl=${encodeURIComponent(
        propsValue.audio_url || ''
      )}&${query.join('&')}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: propsValue.authentication.password,
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
