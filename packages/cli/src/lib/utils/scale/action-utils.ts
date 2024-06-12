import OpenAI from 'openai';
import { openapiCustomFunctions } from './openai-config';
import { Action, OpenAPISpec } from './types';

const CHUNK_SIZE = 10; // Define a chunk size for splitting requests

const generateActions = async (
  openAPISpec: OpenAPISpec,
  authDisplayName: string,
  baseURL: string
): Promise<{ name: string; code: string }[]> => {
  const requests = [];

  for (const [endpoint, methods] of Object.entries(openAPISpec.paths)) {
    for (const [method, details] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        requests.push({ method, endpoint, details });
      }
    }
  }

  const completions = [];
  for (let i = 0; i < requests.length; i += CHUNK_SIZE) {
    const chunk = requests.slice(i, i + CHUNK_SIZE);

    const chunkCompletions = await Promise.all(
      chunk.map(async (obj) => {
        try {
          const openai = new OpenAI({
            apiKey: process.env.AP_OPENAI_KEY,
          });
          const actionsCompletion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: JSON.stringify(obj) }],
            model: 'gpt-4-turbo',
            functions: openapiCustomFunctions,
            function_call: 'auto',
          });

          const actionExtractedData =
            actionsCompletion.choices[0].message.function_call.arguments;

          return JSON.parse(actionExtractedData);
        } catch (error) {
          console.error(
            `Error processing ${obj.endpoint} ${obj.method}:`,
            error
          );
          return null;
        }
      })
    );

    completions.push(...chunkCompletions.filter(Boolean));
  }

  return completions?.map((action) =>
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
      description: '${description?.replace(/\n/g, ' ')}',
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
