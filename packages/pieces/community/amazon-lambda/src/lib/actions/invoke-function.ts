import { createAction, Property } from '@activepieces/pieces-framework';

import { awsLambdaCombinedAuth, type LambdaAuthProps } from '../auth';
import { invokeLambda } from '../common/client';
import { invokeFunctionOutputSchema } from '../output-schemas';

export const invokeFunction = createAction({
  name: 'invokeFunction',
  displayName: 'Invoke Function',
  description: 'Invoke a Lambda function synchronously or asynchronously and return the status code, function error, and payload.',
  auth: awsLambdaCombinedAuth,
  requireAuth: true,
  audience: 'both',
  classification: 'WRITE',
  outputSchema: invokeFunctionOutputSchema,
  aiMetadata: {
    description:
      'Run an AWS Lambda function with an optional JSON payload. Synchronous calls wait and return the function\'s response; asynchronous calls only queue the event. Each call runs the function again, so retries repeat its side effects.',
    idempotent: false,
  },
  props: {
    functionName: Property.ShortText({
      displayName: 'Function name or ARN',
      description: 'Name or ARN. Append :alias to target an alias.',
      required: true,
    }),
    invocationType: Property.StaticDropdown({
      displayName: 'Invocation type',
      description: 'Synchronous waits for the result. Asynchronous returns once queued.',
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
      description: 'JSON sent to the function. Leave empty to send no payload.',
      required: false,
    }),
    failOnFunctionError: Property.Checkbox({
      displayName: 'Fail step on function error',
      description: 'Fail this step when the function throws, instead of returning the error.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { functionName, invocationType, qualifier, payload, failOnFunctionError } = context.propsValue;
    const auth: LambdaAuthProps = context.auth.props;
    return invokeLambda({
      auth,
      server: context.server,
      input: {
        functionName,
        invocationType: invocationType === 'Event' ? 'Event' : 'RequestResponse',
        qualifier,
        payload,
        failOnFunctionError: failOnFunctionError !== false,
      },
    });
  },
});
