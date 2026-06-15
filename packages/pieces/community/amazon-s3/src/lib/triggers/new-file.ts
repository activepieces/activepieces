import { Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { ListObjectsV2CommandInput } from '@aws-sdk/client-s3';
import { MarkdownVariant } from '@activepieces/shared';
import { S3 } from '@aws-sdk/client-s3';
import dayjs from 'dayjs';
import { amazonS3CombinedAuth, AccessKeyAuthProps, OidcAuthProps } from '../auth';
import { resolveS3Client } from '../common';

export const newFile = createTrigger({
  auth: amazonS3CombinedAuth,
  name: 'new_file',
  displayName: 'New or Updated File',
  description: 'Triggers when you add or update a file in your bucket. The bucket/folder you choose must not contain more than 10,000 files.',
  aiMetadata: {
    description: 'Fires when an object is added or modified in the configured S3 bucket, optionally scoped to a folder prefix. Polls the bucket and emits each new or updated file based on its last-modified time. The watched bucket/folder must contain no more than 10,000 files.',
  },
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value: 'Triggers when you add or update a file in your bucket. The bucket/folder you choose must not contain more than 10,000 files.',
    }),
    folderPath: Property.ShortText({
      displayName: 'Folder Path',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await context.store.put('lastPoll', Date.now());
  },
  onDisable: async () => {},
  run: async (context) => {
    const authProps = context.auth.props as AccessKeyAuthProps | OidcAuthProps;
    const s3 = await resolveS3Client({ authProps, server: context.server });
    const lastFetchEpochMS = (await context.store.get<number>('lastPoll')) ?? 0;
    const items = await fetchS3FilesForTrigger({ s3, bucket: authProps.bucket, folderPath: context.propsValue.folderPath, isTest: false });
    const validItems = items.filter((f) => Number.isFinite(f.epochMilliSeconds));
    const newLastEpochMS = validItems.reduce((acc, f) => Math.max(acc, f.epochMilliSeconds), lastFetchEpochMS);
    await context.store.put('lastPoll', newLastEpochMS);
    return validItems.filter((f) => f.epochMilliSeconds > lastFetchEpochMS).map((item) => item.data);
  },
  test: async (context) => {
    const authProps = context.auth.props as AccessKeyAuthProps | OidcAuthProps;
    const s3 = await resolveS3Client({ authProps, server: context.server });
    const items = await fetchS3FilesForTrigger({ s3, bucket: authProps.bucket, folderPath: context.propsValue.folderPath, isTest: true });
    return items.map((item) => item.data);
  },
  sampleData: {
    Key: 'myfolder/100-3.png',
    LastModified: '2023-08-04T13:51:26.000Z',
    ETag: '"e9f16cce12352322272525f5af65a2e"',
    Size: 40239,
    StorageClass: 'STANDARD',
  },
});

async function fetchS3FilesForTrigger({
  s3,
  bucket,
  folderPath,
  isTest,
}: {
  s3: S3;
  bucket: string;
  folderPath: string | undefined;
  isTest: boolean;
}): Promise<{ epochMilliSeconds: number; data: unknown }[]> {
  const MAX_TOTAL_FILES = 10000;
  const bucketFiles = [];
  let totalFetched = 0;
  let hasMore = true;
  let nextToken: string | undefined;

  do {
    const params: ListObjectsV2CommandInput = {
      Bucket: bucket,
      MaxKeys: isTest ? 10 : 1000,
      ContinuationToken: nextToken,
    };
    if (folderPath) {
      params.Prefix = folderPath.endsWith('/')
        ? folderPath.slice(0, -1)
        : folderPath;
    }
    const response = await s3.listObjectsV2(params);
    const items = response.Contents ?? [];
    if (totalFetched + items.length > MAX_TOTAL_FILES) {
      bucketFiles.push(...items.slice(0, MAX_TOTAL_FILES - totalFetched));
      break;
    }
    bucketFiles.push(...items);
    totalFetched += items.length;
    if (isTest) break;
    hasMore = !!response.IsTruncated;
    nextToken = response.NextContinuationToken ?? undefined;
  } while (hasMore);

  return bucketFiles.map((file) => ({
    epochMilliSeconds: dayjs(file.LastModified).valueOf(),
    data: file,
  }));
}
