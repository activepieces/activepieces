import {
  Property,
  createAction
} from '@activepieces/pieces-framework';
import { StopResponse } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';

export const returnContext = createAction({
  name: 'returnContext',
  displayName: 'Respond to the agent',
  description: 'respond to the agent',
  props: {
    body: Property.Json({
      displayName: 'Response',
      required: true,
      defaultValue: {}
    }),
  },

  async test(context) {
    const body = context.propsValue.body;
    await context.store.put('context', body);
    return body
  },

  async run(context) {
    const response: StopResponse = {
      status: StatusCodes.OK,
      headers: {},
    };
    response.body = context.propsValue.body;

    context.run.stop({
      response: response,
    });
    return response;
  },
});
