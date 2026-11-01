import { createAction, Property } from '@activepieces/pieces-framework';

import { awsLambdaCombinedAuth, type LambdaAuthProps } from '../auth';
import { getFunctionDetails } from '../common/client';
import { getFunctionDetailsOutputSchema } from '../output-schemas';

export const getFunctionConfiguration = createAction({
  name: 'getFunctionDetails',
  displayName: 'Get Function Details',
  description: 'Return a function\'s ARN, runtime, handler, memory, timeout, and state.',
  auth: awsLambdaCombinedAuth,
  requireAuth: true,
  audience: 'both',
  classification: 'READ',
  outputSchema: getFunctionDetailsOutputSchema,
  aiMetadata: {
    description:
      'Read the configuration of one AWS Lambda function by name or ARN: runtime, handler, memory, timeout, role, state and version. Use it to inspect a function before invoking it. Read-only and safe to retry.',
    idempotent: true,
  },
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
    includeEnvironment: Property.Checkbox({
      displayName: 'Include environment variables',
      description: 'Values may contain secrets and will appear in run logs.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { functionName, qualifier, includeEnvironment } = context.propsValue;
    const auth: LambdaAuthProps = context.auth.props;
    return getFunctionDetails({
      auth,
      server: context.server,
      input: {
        functionName,
        qualifier,
        includeEnvironment: includeEnvironment === true,
      },
    });
  },
});
