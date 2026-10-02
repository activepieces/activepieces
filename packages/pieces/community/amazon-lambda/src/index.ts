import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { customApiCall } from './lib/actions/custom-api-call';
import { getFunctionConfiguration } from './lib/actions/get-function-details';
import { invokeFunction } from './lib/actions/invoke-function';
import { awsLambdaCombinedAuth } from './lib/auth';
import { newFunctionCreated } from './lib/triggers/new-function-created';

export const amazonLambda = createPiece({
  displayName: 'AWS Lambda',
  description: 'Invoke functions and watch for new ones',
  auth: awsLambdaCombinedAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-lambda.png',
  authors: [],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [invokeFunction, getFunctionConfiguration, customApiCall],
  triggers: [newFunctionCreated],
});
