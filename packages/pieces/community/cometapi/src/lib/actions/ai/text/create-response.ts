import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiCreateResponseOutputSchema } from '../../../output-schemas';

export const createResponseAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_create_response',
  outputSchema: cometapiCreateResponseOutputSchema,
  displayName: 'Create Response',
  description:
    'Generates a model response with the OpenAI Responses API format.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Runs an OpenAI Responses API request on a CometAPI model from plain text input, optionally continuing an earlier stored response by its ID. Prefer it over Create Chat Completion for OpenAI reasoning models and for stateful continuation; pass tools, reasoning or structured-input items through Additional Fields. Each call runs a fresh, billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({ required: true }),
    input: Property.LongText({
      displayName: 'Input',
      description: 'The text prompt for the model.',
      required: true,
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'System-level instructions for this response.',
      required: false,
    }),
    previousResponseId: Property.ShortText({
      displayName: 'Previous Response ID',
      description:
        'The id of a stored response from an earlier Create Response call, to continue that conversation.',
      required: false,
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Output Tokens',
      description:
        'Upper limit on generated tokens, reasoning included. Leave empty for the model default.',
      required: false,
    }),
    temperature: cometApiAiProps.temperature({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/responses',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model: propsValue.model,
          input: propsValue.input,
          instructions: propsValue.instructions,
          previous_response_id: propsValue.previousResponseId,
          max_output_tokens: propsValue.maxOutputTokens,
          temperature: propsValue.temperature,
        },
      }),
    });
  },
});
