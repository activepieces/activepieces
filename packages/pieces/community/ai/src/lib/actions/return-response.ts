import { Property, createAction } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';

export const returnAiResponse = createAction({
  name: 'return-ai-response',
  displayName: 'Return AI Response',
  description: 'Return a structured response to an AI agent',
  props: {
    response: Property.Json({
      displayName: 'Response Data',
      description: 'The data to return to the AI agent',
      required: true,
      defaultValue: {
        result: "Success",
        data: {}
      }
    }),
    status: Property.Number({
      displayName: 'Status Code',
      description: 'HTTP status code to return',
      required: false,
      defaultValue: 200
    })
  },
  errorHandlingOptions: {
    retryOnFailure: {
      hide: true,
    },
    continueOnFailure: {
      hide: true,
    },
  },
  async run({ propsValue, run }) {
    const responseData = propsValue.response;
    const statusCode = propsValue.status || StatusCodes.OK;
    
    run.stop({
      response: {
        status: statusCode,
        body: responseData,
        headers: {
          'Content-Type': 'application/json'
        },
      },
    });
    
    return responseData;
  },
});