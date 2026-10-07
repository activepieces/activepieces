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

export async function remember(
  store: Store,
  functions: FunctionConfiguration[],
  initializeOnly: boolean,
): Promise<FunctionConfiguration[]> {
  const currentArns = uniqueArns(functions.flatMap((fn) => (fn.FunctionArn ? [fn.FunctionArn] : [])));
  const previous = initializeOnly ? null : await readArnChunks({ store, keyPrefix: SEEN_FUNCTION_ARNS_KEY });
  await writeArnChunks({ store, keyPrefix: SEEN_FUNCTION_ARNS_KEY, arns: currentArns });
  if (previous == null) return [];

  const seen = new Set(previous);
  return functions.filter((fn) => fn.FunctionArn && !seen.has(fn.FunctionArn));
}

const STORE_VALUE_MAX_BYTES = 512 * 1024;

function storeKey({ keyPrefix, index }: { keyPrefix: string; index: number }): string {
  return index === 0 ? keyPrefix : `${keyPrefix}-${index}`;
}

async function readArnChunks({
  store,
  keyPrefix,
}: {
  store: Store;
  keyPrefix: string;
}): Promise<string[] | null> {
  const first = await store.get<string[]>(storeKey({ keyPrefix, index: 0 }));
  if (first == null) return null;
  const rest = await readArnChunkTail({ store, keyPrefix, index: 1 });
  return [...first, ...rest];
}

async function readArnChunkTail({
  store,
  keyPrefix,
  index,
}: {
  store: Store;
  keyPrefix: string;
  index: number;
}): Promise<string[]> {
  const chunk = await store.get<string[]>(storeKey({ keyPrefix, index }));
  if (chunk == null) return [];
  const rest = await readArnChunkTail({ store, keyPrefix, index: index + 1 });
  return [...chunk, ...rest];
}

async function writeArnChunks({
  store,
  keyPrefix,
  arns,
}: {
  store: Store;
  keyPrefix: string;
  arns: string[];
}): Promise<void> {
  const chunks = chunkArns(arns);
  for (const [index, chunk] of chunks.entries()) {
    await store.put(storeKey({ keyPrefix, index }), chunk);
  }
  await deleteArnChunkTail({ store, keyPrefix, index: chunks.length });
}

async function deleteSeenArns(store: Store): Promise<void> {
  await deleteArnChunkTail({ store, keyPrefix: SEEN_FUNCTION_ARNS_KEY, index: 0 });
}

async function deleteArnChunkTail({
  store,
  keyPrefix,
  index,
}: {
  store: Store;
  keyPrefix: string;
  index: number;
}): Promise<void> {
  const existing = await store.get<string[]>(storeKey({ keyPrefix, index }));
  if (existing == null) return;
  await store.delete(storeKey({ keyPrefix, index }));
  await deleteArnChunkTail({ store, keyPrefix, index: index + 1 });
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

function uniqueArns(arns: string[]): string[] {
  return [...new Set(arns)];
}
