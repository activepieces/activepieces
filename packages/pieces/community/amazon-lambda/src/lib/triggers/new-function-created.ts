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
    await deleteSeenArns(context.store);
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
  const previous = await readSeenArns(store);
  if (initializeOnly || previous == null) {
    await writeSeenArns({ store, arns: currentArns });
    return [];
  }
  const seen = new Set(previous);
  const created = functions.filter((fn) => fn.FunctionArn && !seen.has(fn.FunctionArn));
  await writeSeenArns({ store, arns: currentArns });
  return created;
}

const STORE_VALUE_MAX_BYTES = 512 * 1024;

function seenArnKey(index: number): string {
  return index === 0 ? SEEN_FUNCTION_ARNS_KEY : `${SEEN_FUNCTION_ARNS_KEY}-${index}`;
}

async function readSeenArns(store: Store): Promise<string[] | null> {
  const first = await store.get<string[]>(seenArnKey(0));
  if (first == null) return null;
  const rest = await readArnChunks({ store, index: 1 });
  return [...first, ...rest];
}

async function readArnChunks({ store, index }: { store: Store; index: number }): Promise<string[]> {
  const chunk = await store.get<string[]>(seenArnKey(index));
  if (chunk == null) return [];
  const rest = await readArnChunks({ store, index: index + 1 });
  return [...chunk, ...rest];
}

async function writeSeenArns({ store, arns }: { store: Store; arns: string[] }): Promise<void> {
  const chunks = chunkArns(arns);
  for (const [index, chunk] of chunks.entries()) {
    await store.put(seenArnKey(index), chunk);
  }
  await deleteArnChunks({ store, index: chunks.length });
}

async function deleteSeenArns(store: Store): Promise<void> {
  await deleteArnChunks({ store, index: 0 });
}

async function deleteArnChunks({ store, index }: { store: Store; index: number }): Promise<void> {
  const existing = await store.get<string[]>(seenArnKey(index));
  if (existing == null) return;
  await store.delete(seenArnKey(index));
  await deleteArnChunks({ store, index: index + 1 });
}

function chunkArns(arns: string[]): string[][] {
  if (arns.length === 0) return [[]];
  const chunks: string[][] = [];
  let current: string[] = [];
  let bytes = 2;
  for (const arn of arns) {
    const itemBytes = Buffer.byteLength(JSON.stringify(arn), 'utf8');
    const separator = current.length === 0 ? 0 : 1;
    if (current.length > 0 && bytes + separator + itemBytes > STORE_VALUE_MAX_BYTES) {
      chunks.push(current);
      current = [arn];
      bytes = 2 + itemBytes;
      continue;
    }
    current.push(arn);
    bytes += separator + itemBytes;
  }
  chunks.push(current);
  return chunks;
}
