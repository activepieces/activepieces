import { createAction, Property } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../../..';
import { backblazeCommon } from '../../common';
import { backblazeGetFileMetadataOutputSchema } from '../../output-schemas';
import { backblazeAiCommon } from './ai-common';

export const backblazeGetFileMetadataAi = createAction({
  auth: backBlazeS3Auth,
  name: 'backblaze_get_file_metadata',
  outputSchema: backblazeGetFileMetadataOutputSchema,
  displayName: 'Get File Metadata',
  description: 'Gets the size, content type and metadata of a file without downloading it.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the size in bytes, content type, ETag, last-modified time, version id and custom metadata of one file in the connected Backblaze B2 bucket, without downloading it. Use it to check that a file exists or how large it is before reading it. Needs the exact key, as returned by List Files.',
    idempotent: true,
  },
  props: {
    key: Property.ShortText({
      displayName: 'File Key',
      description: 'The full key (path) of the file, e.g. "reports/2024/q1.csv".',
      required: true,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { key } = context.propsValue;
    const s3 = backblazeCommon.createBackBlazeS3(context.auth.props);
    const response = await backblazeAiCommon.call({
      operation: 'get file metadata',
      key,
      request: () => s3.headObject({ Bucket: bucket, Key: key }),
    });
    return {
      key,
      size: response.ContentLength ?? null,
      contentType: response.ContentType ?? null,
      etag: response.ETag ?? null,
      lastModified: backblazeAiCommon.toIso(response.LastModified),
      versionId: response.VersionId ?? null,
      metadata: response.Metadata ?? {},
    };
  },
});
