import { randomUUID } from 'node:crypto';

import { createTrigger, TriggerStrategy, type Store } from '@activepieces/pieces-framework';
import type { FunctionConfiguration } from '@aws-sdk/client-lambda';

import { awsLambdaCombinedAuth, type LambdaAuthProps } from '../auth';
import { listFunctions } from '../common/client';

export async function remember({
  store,
  functions,
  initializeOnly,
}: {
  store: Store;
  functions: FunctionConfiguration[];
  initializeOnly: boolean;
}): Promise<FunctionConfiguration[]> {
  const currentArns = uniqueArns(functions.flatMap((fn) => (fn.FunctionArn ? [fn.FunctionArn] : [])));
  const pointer = await readPointer(store);
  const previous = initializeOnly || pointer === null ? null : await readSnapshot({ store, pointer });
  await writeSnapshot({ store, arns: currentArns, replaced: pointer });
  if (previous == null) return [];

  const seen = new Set(previous);
  return functions.filter((fn) => fn.FunctionArn && !seen.has(fn.FunctionArn));
}

function chunkKey({ snapshotId, index }: { snapshotId: string; index: number }): string {
  return `${SEEN_FUNCTION_ARNS_KEY}:${snapshotId}:${index}`;
}

async function readPointer(store: Store): Promise<SnapshotPointer | null> {
  const pointer = await store.get<unknown>(SEEN_FUNCTION_ARNS_KEY);
  return isSnapshotPointer(pointer) ? pointer : null;
}

async function readSnapshot({ store, pointer }: { store: Store; pointer: SnapshotPointer }): Promise<string[]> {
  const chunks = await Promise.all(
    Array.from({ length: pointer.chunkCount }, (_, index) => store.get<string[]>(chunkKey({ snapshotId: pointer.snapshotId, index }))),
  );
  if (chunks.some((chunk) => chunk == null)) {
    throw new Error('The saved function snapshot is incomplete. The next check will retry.');
  }
  return chunks.flatMap((chunk) => chunk ?? []);
}

async function writeSnapshot({
  store,
  arns,
  replaced,
}: {
  store: Store;
  arns: string[];
  replaced: SnapshotPointer | null;
}): Promise<void> {
  const snapshotId = randomUUID();
  const chunks = chunkArns(arns);
  for (const [index, chunk] of chunks.entries()) {
    await store.put(chunkKey({ snapshotId, index }), chunk);
  }
  await store.put<SnapshotPointer>(SEEN_FUNCTION_ARNS_KEY, { snapshotId, chunkCount: chunks.length });
  if (replaced === null) return;
  await Promise.all(
    Array.from({ length: replaced.chunkCount }, (_, index) =>
      store.delete(chunkKey({ snapshotId: replaced.snapshotId, index })).catch(() => undefined),
    ),
  );
}

function isSnapshotPointer(value: unknown): value is SnapshotPointer {
  if (typeof value !== 'object' || value === null) return false;
  const snapshotId: unknown = Reflect.get(value, 'snapshotId');
  const chunkCount: unknown = Reflect.get(value, 'chunkCount');
  return typeof snapshotId === 'string' && typeof chunkCount === 'number' && Number.isInteger(chunkCount) && chunkCount > 0;
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

const STORE_VALUE_MAX_BYTES = 512 * 1024;

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
    if (context.isRepublish === true && (await readPointer(context.store)) !== null) {
      return;
    }
    const functions = await listFunctions(context.auth.props as LambdaAuthProps, context.server);
    await remember({ store: context.store, functions, initializeOnly: true });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const functions = await listFunctions(context.auth.props as LambdaAuthProps, context.server);
    return remember({ store: context.store, functions, initializeOnly: false });
  },
  async test(context) {
    const functions = await listFunctions(context.auth.props as LambdaAuthProps, context.server);
    return functions.slice(0, 10);
  },
});

type SnapshotPointer = {
  snapshotId: string;
  chunkCount: number;
};
