import OpenAI from 'openai';
import {
  openapiAuthFunctions,
  openapiExtractAuthTypeFunctions,
} from './openai-config';
import { AuthDetails, OpenAPISpec } from './types';

export const openai = new OpenAI({
  apiKey: '',
});

export const extractAuthType = async (
  openAPISpec: OpenAPISpec
): Promise<string> => {
  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: JSON.stringify(openAPISpec) }],
    model: 'gpt-4-turbo',
    functions: openapiExtractAuthTypeFunctions,
    function_call: 'auto',
    response_format: { type: 'json_object' },
  });
  return JSON.parse(response.choices[0].message.function_call.arguments)
    .authType;
};

export const extractAuthDetails = async (
  openAPISpec: OpenAPISpec
): Promise<AuthDetails> => {
  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: JSON.stringify(openAPISpec) }],
    model: 'gpt-4-turbo',
    functions: openapiAuthFunctions,
    function_call: 'auto',
    response_format: { type: 'json_object' },
  });
  return JSON.parse(response.choices[0].message.function_call.arguments);
};
