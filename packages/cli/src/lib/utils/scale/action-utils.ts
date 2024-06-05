import { openapiCustomFunctions } from './openai-config';
import { openai } from './openai-utils';
import { Action, OpenAPISpec } from './types';

const generateActions = async (
  openAPISpec: OpenAPISpec,
  authDisplayName: string,
  baseURL: string
): Promise<{ name: string; code: string }[]> => {
  const requests = [];

  for (const [endpoint, methods] of Object.entries(openAPISpec.paths)) {
    for (const [method, details] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'delete'].includes(method)) {
        requests.push({ method, endpoint, details });
      }
    }
  }

  const completions = await Promise.all(
    requests.map(async (obj) => {
      const actionsCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: JSON.stringify(obj) }],
        model: 'gpt-4-turbo',
        functions: openapiCustomFunctions,
        function_call: 'auto',
      });

      const actionExtractedData =
        actionsCompletion.choices[0].message.function_call.arguments;

      return JSON.parse(actionExtractedData);
    })
  );

  return completions.map((action) =>
    createActionTemplate(action, baseURL, authDisplayName)
  );
};

const createActionTemplate = (
  action: Action,
  baseURL: string,
  authDisplayName: string
): { name: string; code: string } => {
  const {
    endpoint,
    method,
    operationId,
    summary,
    description,
    parameters,
    requestBody,
  } = action;

  const props = parameters
    .map(
      (param) => `
    ${param.name}: Property.ShortText({
      displayName: '${param.description}',
      required: ${param.required},
    }),`
    )
    .join('');

  return {
    name: operationId,
    code: `
    import { httpClient, HttpMethod } from '@activepieces/pieces-common';
    import { createAction, Property } from '@activepieces/pieces-framework';
    import { ${authDisplayName} } from '../..';

    export const ${operationId} = createAction({
      auth: ${authDisplayName},
      name: '${operationId}',
      displayName: '${summary}',
      description: '${description.replace(/\n/g, ' ')}',
      props: {${props}},
      run: async (ctx) => {
        return await httpClient.sendRequest({
          method: HttpMethod.${method.toUpperCase()},
          url: \`${baseURL}${endpoint}\`,
          headers: {
            Authorization: \`\${ctx.auth}\`,
          },
          body: ctx.propsValue,
        }).then(res => res.body);
      },
    });
  `,
  };
};

const determinePropertyType = (type: string): string => {
  switch (type) {
    case 'string':
      return 'ShortText';
    case 'integer':
      return 'Number';
    case 'boolean':
      return 'Checkbox';
    default:
      return 'ShortText';
  }
};

export { createActionTemplate, determinePropertyType, generateActions };
