import { AppConnectionValueForAuthProperty, Property, ServerContext, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { ListObjectsV2CommandInput, S3 } from '@aws-sdk/client-s3';
import { MarkdownVariant } from '@activepieces/shared';
import dayjs from 'dayjs';
import { amazonS3CombinedAuth, S3AuthProps } from '../auth';
import { resolveS3Client } from '../common';

const createPolling = (
  server: ServerContext,
): Polling<AppConnectionValueForAuthProperty<typeof amazonS3CombinedAuth>, { folderPath?: string }> => ({
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const authProps: S3AuthProps = auth.props;
    const s3 = await resolveS3Client({ authProps, server });
    const files = await fetchS3FilesForTrigger({
      s3,
      bucket: authProps.bucket,
      folderPath: propsValue.folderPath,
      isTest: lastFetchEpochMS === 0,
    });
    return files.filter((f) => Number.isFinite(f.epochMilliSeconds));
  },
});

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
    await pollingHelper.onEnable(createPolling(context.server), {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(createPolling(context.server), {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return pollingHelper.poll(createPolling(context.server), {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return pollingHelper.test(createPolling(context.server), {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
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
