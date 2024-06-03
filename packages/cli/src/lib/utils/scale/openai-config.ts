export const openapiExtractAuthTypeFunctions = [
  {
    name: 'extract_auth_type',
    description:
      'Get the security scheme type from the openAPI spec provided in JSON format, eg: apiKey or OAuth2 ..etc',
    parameters: {
      type: 'object',
      properties: {
        authType: {
          type: 'string',
          description:
            'The Authentication type of the openAPI spec for the specific service in all lowercase',
        },
      },
    },
  },
];

export const openapiBaseURLFunction = [
  {
    name: 'extract_openapi_baseurl',
    description:
      'Get the BASE URL or host from the openAPI spec, its not always the same key names maybe its called host maybe you can find it in a servers array in the first object.',
    parameters: {
      type: 'object',
      properties: {
        baseURL: {
          type: 'string',
          description: 'The base url or host for the service server eg: api.sendsms.ro, https://slack.com/api, ...etc',
        },
      },
    },
  },
];

export const openapiAuthFunctions = [
  {
    name: 'extract_openapi_oauth2_info',
    description:
      'Get the OAuth2 security scheme information needed for this api spec authentication from the body of the input text',
    parameters: {
      type: 'object',
      properties: {
        displayName: {
          type: 'string',
          description:
            'The display name for auth method based on the service name itself eg: SlacAuth, TrelloAuth, DiscordAuth it should be one word no spaces',
        },
        description: {
          type: 'string',
          description:
            'Description of markdown type, for guiding user through auth process from the service documentation. Like how to setup the OAuth2 for discord, asana, slack, meta apis, In steps',
        },
        authUrl: {
          type: 'string',
          description: 'The Authentication url for OAuth2 method',
        },
        tokenUrl: {
          type: 'string',
          description: 'The Token url for OAuth2 method',
        },
        required: {
          type: 'boolean',
          description: 'Is this auth required or not?!',
        },
        scope: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
  },
  {
    name: 'extract_openapi_apikey_info',
    description:
      'Get the API Key security scheme information needed for this api spec authentication from the body of the input text',
    parameters: {
      type: 'object',
      properties: {
        displayName: {
          type: 'string',
          description:
            'The display name for auth method based on the service name itself eg: SlacAuth, TrelloAuth, DiscordAuth it should be one word no spaces',
        },
        description: {
          type: 'string',
          description:
            'Description of markdown type, How to setup an API Key auth type for a service api like asana, slack, discord, trello, google-sheets ...etc In steps',
        },
        required: {
          type: 'boolean',
          description: 'Is this auth required or not?!',
        },
      },
    },
  },
];

export const openapiCustomFunctions = [
  {
    name: 'extract_openapi_action_info',
    description:
      'Get the action information needed for this API spec from the body of the input text',
    parameters: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'The endpoint of the API method',
        },
        method: {
          type: 'string',
          description: 'The HTTP method of the API method',
        },
        operationId: {
          type: 'string',
          description: 'The operation ID of the API method',
        },
        summary: {
          type: 'string',
          description: 'The summary of the API method',
        },
        description: {
          type: 'string',
          description: 'The description of the API method',
        },
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'The name of the parameter',
              },
              description: {
                type: 'string',
                description: 'The description of the parameter',
              },
              required: {
                type: 'boolean',
                description: 'Is the parameter required or not?',
              },
            },
          },
        },
        requestBody: {
          type: 'object',
          properties: {
            content: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
    },
  },
];
