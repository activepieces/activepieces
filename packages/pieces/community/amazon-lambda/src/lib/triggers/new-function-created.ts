import { createTrigger, TriggerStrategy, type Store } from '@activepieces/pieces-framework';
import type { FunctionConfiguration } from '@aws-sdk/client-lambda';

import { awsLambdaCombinedAuth, type LambdaAuthProps } from '../auth';
import { listFunctions } from '../common/client';

export const SEEN_FUNCTION_ARNS_KEY = 'seen-function-arns';

export const newFunctionCreated = createTrigger({
  name: 'newFunctionCreated',
  displayName: 'New Function Created',
  description: 'Fires when a Lambda function ARN appears that was not present the last time this trigger ran. Enabling it records the current functions and stays quiet.',
  auth: awsLambdaCombinedAuth,
  requireAuth: true,
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    FunctionName: 'billing-webhook',
    FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:billing-webhook',
    Runtime: 'nodejs20.x',
    Handler: 'index.handler',
    LastModified: '2026-09-28T12:00:00.000+0000',
  },
  async onEnable(context) {
    const functions = await listFunctions(context.auth.props as LambdaAuthProps, context.server);
    await remember(context.store, functions, true);
  },
  async onDisable(context) {
    await context.store.delete(SEEN_FUNCTION_ARNS_KEY);
  },
  async run(context) {
    const functions = await listFunctions(context.auth.props as LambdaAuthProps, context.server);
    return remember(context.store, functions, false);
  },
  async test(context) {
    const functions = await listFunctions(context.auth.props as LambdaAuthProps, context.server);
    return functions.slice(0, 10);
  },
});

// NOTE: A missing snapshot stores the current ARNs and returns nothing, so the first poll does not emit every function.
export async function remember(
  store: Store,
  functions: FunctionConfiguration[],
  initializeOnly: boolean,
): Promise<FunctionConfiguration[]> {
  const currentArns = functions.flatMap((fn) => (fn.FunctionArn ? [fn.FunctionArn] : []));
  const previous = await store.get<string[]>(SEEN_FUNCTION_ARNS_KEY);
  if (initializeOnly || previous == null) {
    await store.put(SEEN_FUNCTION_ARNS_KEY, currentArns);
    return [];
  }
  const seen = new Set(previous);
  const created = functions.filter((fn) => fn.FunctionArn && !seen.has(fn.FunctionArn));
  await store.put(SEEN_FUNCTION_ARNS_KEY, currentArns);
  return created;
}
