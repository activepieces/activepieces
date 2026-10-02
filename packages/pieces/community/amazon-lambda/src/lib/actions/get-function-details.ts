import { createAction, Property } from '@activepieces/pieces-framework';

import { awsLambdaCombinedAuth, type LambdaAuthProps } from '../auth';
import { getFunctionDetails } from '../common/client';

export const getFunctionConfiguration = createAction({
  name: 'getFunctionDetails',
  displayName: 'Get Function Details',
  description: 'Return a function\'s ARN, runtime, handler, memory, timeout, and environment variables.',
  auth: awsLambdaCombinedAuth,
  requireAuth: true,
  props: {
    functionName: Property.ShortText({
      displayName: 'Function name or ARN',
      description: 'Name, partial ARN, or full ARN of the function.',
      required: true,
    }),
    qualifier: Property.ShortText({
      displayName: 'Qualifier',
      description: 'Optional version or alias. Leave empty to read $LATEST.',
      required: false,
    }),
  },
  async run(context) {
    const { functionName, qualifier } = context.propsValue;
    return getFunctionDetails(
      context.auth.props as LambdaAuthProps,
      context.server,
      functionName,
      qualifier,
    );
  },
});
