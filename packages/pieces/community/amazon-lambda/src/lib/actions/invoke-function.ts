import { createAction, Property } from '@activepieces/pieces-framework';

import { awsLambdaCombinedAuth, type LambdaAuthProps } from '../auth';
import { invokeLambda } from '../common/client';

export const invokeFunction = createAction({
  name: 'invokeFunction',
  displayName: 'Invoke Function',
  description: 'Invoke a Lambda function synchronously or asynchronously and return the status code, function error, and payload.',
  auth: awsLambdaCombinedAuth,
  requireAuth: true,
  props: {
    functionName: Property.ShortText({
      displayName: 'Function name or ARN',
      description: 'Name, partial ARN, or full ARN. A qualifier can also be appended (my-function:alias).',
      required: true,
    }),
    invocationType: Property.StaticDropdown({
      displayName: 'Invocation type',
      description: 'Synchronous waits for the function result. Asynchronous returns as soon as Lambda accepts the event.',
      required: true,
      defaultValue: 'RequestResponse',
      options: {
        options: [
          { label: 'Synchronous (RequestResponse)', value: 'RequestResponse' },
          { label: 'Asynchronous (Event)', value: 'Event' },
        ],
      },
    }),
    qualifier: Property.ShortText({
      displayName: 'Qualifier',
      description: 'Optional version or alias. Leave empty to invoke $LATEST.',
      required: false,
    }),
    payload: Property.Json({
      displayName: 'Payload',
      description: 'JSON object sent to the function. Leave empty to send no payload.',
      required: false,
    }),
  },
  async run(context) {
    const { functionName, invocationType, qualifier, payload } = context.propsValue;
    return invokeLambda(context.auth.props as LambdaAuthProps, context.server, {
      functionName,
      invocationType: invocationType as 'RequestResponse' | 'Event',
      qualifier,
      payload,
    });
  },
});
