import { createAction, Property } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../../..';
import { backblazeCommon } from '../../common';
import { backblazeListFilesOutputSchema } from '../../output-schemas';
import { backblazeAiCommon } from './ai-common';

export const backblazeListFilesAi = createAction({
  auth: backBlazeS3Auth,
  name: 'backblaze_list_files',
  outputSchema: backblazeListFilesOutputSchema,
  displayName: 'List Files',
  description: 'Lists files in the connected bucket, optionally under a folder prefix.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists files in the connected Backblaze B2 bucket in key order, returning each file\'s key, size, last-modified time, ETag and storage class. Use it to discover the exact keys other Backblaze tools need. Filter with a key prefix such as "reports/2024/"; turn on "Group By Folder" to get immediate sub-folders in "folders" instead of every nested file. Returns at most "Max Results" (1-1000) files; when "isTruncated" is true, pass "nextContinuationToken" back as "Continuation Token" for the next page.',
    idempotent: true,
  },
  props: {
    prefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'Only list keys starting with this text, e.g. "reports/2024/".',
      required: false,
    }),
    groupByFolder: Property.Checkbox({
      displayName: 'Group By Folder',
      description: 'Return sub-folders under the prefix in "folders" instead of listing nested files.',
      required: false,
      defaultValue: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of files to return, 1 to 1000. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
    continuationToken: Property.ShortText({
      displayName: 'Continuation Token',
      description: 'The "nextContinuationToken" from a previous List Files call.',
      required: false,
    }),
    startAfter: Property.ShortText({
      displayName: 'Start After',
      description: 'Only list keys that sort after this key.',
      required: false,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { prefix, groupByFolder, maxResults, continuationToken, startAfter } = context.propsValue;
    const maxKeys = maxResults ?? 100;
    if (!Number.isInteger(maxKeys) || maxKeys < 1 || maxKeys > 1000) {
      throw new Error('Max Results must be a whole number from 1 to 1000.');
    }
    const s3 = backblazeCommon.createBackBlazeS3(context.auth.props);
    const response = await backblazeAiCommon.call({
      operation: 'list files',
      request: () =>
        s3.listObjectsV2({
          Bucket: bucket,
          Prefix: prefix || undefined,
          Delimiter: groupByFolder ? '/' : undefined,
          MaxKeys: maxKeys,
          ContinuationToken: continuationToken || undefined,
          StartAfter: startAfter || undefined,
        }),
    });
    const files = (response.Contents ?? []).map((item) => ({
      key: item.Key ?? '',
      size: item.Size ?? null,
      lastModified: backblazeAiCommon.toIso(item.LastModified),
      etag: item.ETag ?? null,
      storageClass: item.StorageClass ?? null,
    }));
    return {
      files,
      folders: (response.CommonPrefixes ?? []).flatMap((item) => (item.Prefix ? [item.Prefix] : [])),
      count: files.length,
      isTruncated: response.IsTruncated ?? false,
      nextContinuationToken: response.NextContinuationToken ?? null,
    };
  },
});
