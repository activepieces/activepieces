import { Property, createAction } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';

export const response = createAction({
  name: 'returnResponse',
  displayName: 'Return Response',
  description: 'Return response to the original flow',
  props: {
    response: Property.Json({
      displayName: 'Response',
      required: true,
    }),
  },
  async run(context) {
    context.run.stop({
      response: {
        body: context.propsValue.response,
        status: StatusCodes.OK,
      },
    });
    return context.propsValue.response;
  },
});
