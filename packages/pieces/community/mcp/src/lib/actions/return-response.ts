import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { StopResponse } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';


export const returnResponse = createAction({
  name: 'return_response',
  displayName: 'Return Response',
  description: 'return a response',
  props: {
    response: Property.Json({
      displayName: 'JSON Body',
      required: true,
    }),
    respond: Property.StaticDropdown({
      displayName: 'Flow Execution',
      required: false,
      defaultValue: 'stop',
      options: {
        disabled: false,
        options: [
          { label: 'Stop', value: 'stop' },
          { label: 'Respond and Continue', value: 'respond' },
        ],
      },
    }),
  },

  async run(context) {
    const { response, respond } = context.propsValue;

    const stopResponse: StopResponse = {
      status: StatusCodes.OK,
      headers: {},
      body: response
    };
    
    if (respond === 'respond') {
      context.run.respond({
        response: stopResponse,
      });
    } else {
      context.run.stop({
        response: stopResponse,
      });
    }
    return stopResponse;
  },
});
