import { createAction, Property } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../../..';
import { backblazeCommon } from '../../common';
import { backblazeCopyFileOutputSchema } from '../../output-schemas';
import { backblazeAiCommon } from './ai-common';

export const backblazeCopyFileAi = createAction({
  auth: backBlazeS3Auth,
  name: 'backblaze_copy_file',
  outputSchema: backblazeCopyFileOutputSchema,
  displayName: 'Copy File',
  description: 'Copies a file to another key in the connected bucket.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies one file to a new key in the same connected Backblaze B2 bucket, keeping its content type and metadata. The source file is left in place. By default it fails when a file already exists at the destination key; set "Overwrite" to replace it. The existence check is a separate request, so it is not atomic against a concurrent writer.',
    idempotent: false,
  },
  props: {
    sourceKey: Property.ShortText({
      displayName: 'Source File Key',
      description: 'The full key of the file to copy, as returned by List Files.',
      required: true,
    }),
    destinationKey: Property.ShortText({
      displayName: 'Destination File Key',
      description: 'The full key to copy the file to, e.g. "archive/q1.csv".',
      required: true,
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite',
      description: 'Replace a file that already exists at the destination key.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { sourceKey, destinationKey, overwrite } = context.propsValue;
    if (sourceKey === destinationKey) {
      throw new Error('Source and destination keys must be different.');
    }
    const s3 = backblazeCommon.createBackBlazeS3(context.auth.props);
    if (!overwrite) {
      const exists = await destinationExists({ s3, bucket, key: destinationKey });
      if (exists) {
        throw new Error(
          `Backblaze copy file: a file already exists at "${destinationKey}" and Overwrite is off.`,
        );
      }
    }
    const response = await backblazeAiCommon.call({
      operation: 'copy file',
      key: sourceKey,
      request: () =>
        s3.copyObject({
          Bucket: bucket,
          Key: destinationKey,
          CopySource: backblazeAiCommon.copySource({ bucket, key: sourceKey }),
        }),
    });
    return {
      sourceKey,
      destinationKey,
      etag: response.CopyObjectResult?.ETag ?? null,
      versionId: response.VersionId ?? null,
    };
  },
});

async function destinationExists({
  s3,
  bucket,
  key,
}: {
  s3: ReturnType<typeof backblazeCommon.createBackBlazeS3>;
  bucket: string;
  key: string;
}): Promise<boolean> {
  try {
    await s3.headObject({ Bucket: bucket, Key: key });
    return true;
  } catch (error) {
    if (backblazeAiCommon.isMissing(error)) {
      return false;
    }
    throw backblazeAiCommon.toActionError({ error, operation: 'copy file', key });
  }
}
