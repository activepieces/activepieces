import { Property, createAction } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';

export const httpReturnResponse = createAction({
  name: 'return_response',
  displayName: 'Return Response',
  description: 'Return a response',
  props: {
    status: Property.Number({
      displayName: 'Status',
      required: false,
      defaultValue: 200,
    }),
    headers: Property.Object({
      displayName: 'Headers',
      required: false,
      defaultValue: { 'Content-Type': 'application/xml' }, // Default to XML Content-Type
    }),
    body: Property.LongText({ // Use LongText for string content
      displayName: 'Response',
      required: true,
    }),
  },

  async run(context) {
    const response = {
      status: context.propsValue.status ?? StatusCodes.OK,
      body: context.propsValue.body, // Ensure this is a string in XML format
      headers: context.propsValue.headers as Record<string, string> ?? { 'Content-Type': 'application/xml' },
    };
    context.run.stop({
      response: response,
    })
    return response;
  },
});
