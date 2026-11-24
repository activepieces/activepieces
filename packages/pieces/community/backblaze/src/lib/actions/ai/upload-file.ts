import { createAction, Property } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../../..';
import { backblazeCommon } from '../../common';
import { backblazeUploadFileAiOutputSchema } from '../../output-schemas';
import { backblazeAiCommon } from './ai-common';

export const backblazeUploadFileAi = createAction({
  auth: backBlazeS3Auth,
  name: 'backblaze_upload_file',
  outputSchema: backblazeUploadFileAiOutputSchema,
  displayName: 'Upload File',
  description: 'Uploads a file or text content to an exact key in the connected bucket.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Writes a file or text content to the exact key given in the connected Backblaze B2 bucket; the key is used as-is, no extension is added. Provide exactly one of File or Text Content. By default it fails when a file already exists at the key; set "Overwrite" to replace it. The existence check is a separate request before the upload, so it is not atomic against a concurrent writer. On a versioned bucket every call adds a new version.',
    idempotent: false,
  },
  props: {
    key: Property.ShortText({
      displayName: 'File Key',
      description: 'The full key (path) to write, including the file name and extension, e.g. "reports/q1.csv".',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload. Leave empty when using Text Content.',
      required: false,
    }),
    textContent: Property.LongText({
      displayName: 'Text Content',
      description: 'Text to store as the file content, e.g. CSV or JSON. Leave empty when using File.',
      required: false,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      description:
        'MIME type, e.g. "text/csv". Defaults to "text/plain; charset=utf-8" for text and "application/octet-stream" for files.',
      required: false,
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite',
      description: 'Replace a file that already exists at this key.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { key, file, textContent, contentType, overwrite } = context.propsValue;
    const hasText = typeof textContent === 'string' && textContent !== '';
    if (file && hasText) {
      throw new Error('Provide either File or Text Content, not both.');
    }
    if (!file && !hasText) {
      throw new Error('Provide File or Text Content to upload.');
    }
    const s3 = backblazeCommon.createBackBlazeS3(context.auth.props);
    if (!overwrite) {
      const exists = await fileExists({ s3, bucket, key });
      if (exists) {
        throw new Error(
          `Backblaze upload file: a file already exists at "${key}" and Overwrite is off.`,
        );
      }
    }
    const body = file ? file.data : Buffer.from(textContent ?? '', 'utf8');
    const resolvedContentType =
      contentType || (file ? 'application/octet-stream' : 'text/plain; charset=utf-8');
    const response = await backblazeAiCommon.call({
      operation: 'upload file',
      key,
      request: () =>
        s3.putObject({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: resolvedContentType,
        }),
    });
    return {
      key,
      etag: response.ETag ?? null,
      versionId: response.VersionId ?? null,
      size: body.length,
      contentType: resolvedContentType,
    };
  },
});

async function fileExists({
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
    throw backblazeAiCommon.toActionError({ error, operation: 'upload file', key });
  }
}
