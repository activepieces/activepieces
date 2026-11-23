import { isNil } from '@activepieces/pieces-framework';
import type * as SnsSdk from '@aws-sdk/client-sns';
import { mapSnsError } from './errors';

async function createSnsClient({
  auth,
}: {
  auth: SnsAuthProps;
}): Promise<{ client: SnsSdk.SNSClient; sdk: typeof SnsSdk }> {
  const sdk = await import('@aws-sdk/client-sns');
  const endpoint = isNil(auth.endpoint) ? '' : auth.endpoint.trim();
  const client = new sdk.SNSClient({
    credentials: {
      accessKeyId: auth.accessKeyId.trim(),
      secretAccessKey: auth.secretAccessKey.trim(),
    },
    region: auth.region,
    endpoint: endpoint === '' ? undefined : endpoint,
  });
  return { client, sdk };
}

async function callSns<T>({
  operation,
  call,
}: {
  operation: string;
  call: () => Promise<T>;
}): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw mapSnsError({ operation, error });
  }
}

async function collectPages<T>({
  operation,
  noun,
  fetchPage,
  cap,
  onCap,
}: {
  operation: string;
  noun: string;
  fetchPage: (nextToken: string | undefined) => Promise<SnsPage<T>>;
  cap: number;
  onCap: 'throw' | 'truncate';
}): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  let nextToken: string | undefined = undefined;
  do {
    const page: SnsPage<T> = await callSns({
      operation,
      call: () => fetchPage(nextToken),
    });
    for (const item of page.items) {
      items.push(item);
    }
    nextToken = page.nextToken;
    if (items.length >= cap && !isNil(nextToken) && nextToken !== '') {
      if (onCap === 'throw') {
        throw new Error(
          `Amazon SNS ${operation} found more than ${cap} ${noun}. This action returns at most ${cap}; narrow the request (for example by topic) or clean up unused ${noun}.`
        );
      }
      return { items: items.slice(0, cap), truncated: true };
    }
  } while (!isNil(nextToken) && nextToken !== '');
  return { items, truncated: false };
}

function topicNameFromArn({ arn }: { arn: string }): string {
  const parts = arn.split(':');
  return parts[parts.length - 1] ?? arn;
}

const SNS_LIST_CAP = 1000;

type SnsPage<T> = { items: T[]; nextToken: string | undefined };

export type SnsAuthProps = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string | undefined;
};

export {
  createSnsClient,
  callSns,
  collectPages,
  topicNameFromArn,
  SNS_LIST_CAP,
};
