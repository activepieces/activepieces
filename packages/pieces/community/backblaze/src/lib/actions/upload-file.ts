import { Property, createAction } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../..';
import { backblazeCommon } from '../common';
import { backblazeUploadFileOutputSchema } from '../output-schemas';
import { backblazeAiCommon } from './ai/ai-common';
import { ObjectCannedACL } from '@aws-sdk/client-s3';

export const backBlazes3UploadFileAction = createAction({
  auth: backBlazeS3Auth,
  name: 'upload-backblaze-file',
  classification: 'WRITE',
  displayName: 'Upload File',
  description:
    'Upload a file to the bucket. The file type\'s subtype is always appended to the name as an extension (e.g. "report" + application/pdf = "report.pdf"). The returned URL only opens for public buckets.',
  audience: 'human',
  outputSchema: backblazeUploadFileOutputSchema,
  aiMetadata: { description: 'Uploads a file to the configured Backblaze B2 (S3-compatible) bucket, returning the stored key and a public URL. Use to persist binary or text content to object storage. Requires the file content and a MIME type; an optional file name may include a full path for sub-directories, and when omitted a timestamped name is generated. Not idempotent: it writes an object on every call, and an omitted name produces a new object each time.', idempotent: false },
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      required: false,
      description: 'my-file-name (no extension). write full path if you want to store in the directories or sub-directories.',
    }),
    acl: Property.StaticDropdown({
      displayName: 'ACL',
      description:
        'Optional. Backblaze B2 only accepts "private" on private buckets and "public-read" on public buckets; any other value is rejected. Leave empty to use the bucket default.',
      required: false,
      options: {
        options: [
          {
            label: 'private',
            value: 'private',
          },
          {
            label: 'public-read',
            value: 'public-read',
          },
          {
            label: 'public-read-write',
            value: 'public-read-write',
          },
          {
            label: 'authenticated-read',
            value: 'authenticated-read',
          },
          {
            label: 'aws-exec-read',
            value: 'aws-exec-read',
          },
          {
            label: 'bucket-owner-read',
            value: 'bucket-owner-read',
          },
          {
            label: 'bucket-owner-full-control',
            value: 'bucket-owner-full-control',
          },
        ],
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          {
            label: 'image/png',
            value: 'image/png',
          },
          {
            label: 'image/jpeg',
            value: 'image/jpeg',
          },
          {
            label: 'image/gif',
            value: 'image/gif',
          },
          {
            label: 'audio/mpeg',
            value: 'audio/mpeg',
          },
          {
            label: 'audio/wav',
            value: 'audio/wav',
          },
          {
            label: 'video/mp4',
            value: 'video/mp4',
          },
          {
            label: 'application/pdf',
            value: 'application/pdf',
          },
          {
            label: 'application/msword',
            value: 'application/msword',
          },
          {
            label: 'text/plain',
            value: 'text/plain',
          },
          {
            label: 'application/json',
            value: 'application/json',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { file, fileName, acl, type } = context.propsValue;

    const s3 = backblazeCommon.createBackBlazeS3(context.auth.props);

    const contentType = type;
    const ext = contentType.split('/')[1];
    const extension = '.' + ext;

    const generatedName = new Date().toISOString() + Date.now() + extension;

    const finalFileName = fileName ? fileName + extension : generatedName;

    const cannedAcl = Object.values(ObjectCannedACL).find((value) => value === acl);
    const uploadResponse = await s3
      .putObject({
        Bucket: bucket,
        Key: finalFileName,
        ACL: cannedAcl,
        ContentType: contentType,
        Body: file.data,
      })
      .catch((error: unknown) => {
        throw toUploadError({ error, acl, key: finalFileName });
      });

    const url = backblazeCommon.publicFileUrl({ auth: context.auth.props, key: finalFileName });
    return {
      fileName: finalFileName,
      etag: uploadResponse.ETag,
      url: url,
    };
  },
});

function toUploadError({ error, acl, key }: { error: unknown; acl: string | undefined; key: string }): Error {
  const { name, message } = backblazeCommon.readSdkError(error);
  if (name === 'InvalidArgument' && (message ?? '').toLowerCase().includes('canned acl')) {
    return new Error(
      `Backblaze upload file: the ACL "${acl ?? ''}" does not match the bucket's privacy. Backblaze B2 only accepts "private" on private buckets and "public-read" on public buckets; pick the matching value or leave ACL empty (${name}: ${message}).`,
    );
  }
  return backblazeAiCommon.toActionError({ error, operation: 'upload file', key });
}
