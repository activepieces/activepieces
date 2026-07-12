import { ApFileRef, Property, createAction } from '@activepieces/pieces-framework';
import { amazonS3CombinedAuth, S3AuthProps } from '../auth';
import { resolveS3Client } from '../common';
import { ObjectCannedACL } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import mime from 'mime-types';

export const amazons3UploadFile = createAction({
  auth: amazonS3CombinedAuth,
  name: 'upload-file',
  displayName: 'Upload File',
  description: 'Upload an File to S3',
  audience: 'both',
  aiMetadata: {
    description: 'Uploads a file to the configured S3 bucket, optionally setting a destination filename, content type, and canned ACL (e.g. private vs. public-read). Use to store new content in S3. Not idempotent: when no filename is given a unique timestamp-based key is generated, so each call writes a new object.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload to S3.',
      required: true,
      stream: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name (Optional)',
      required: false,
      description: 'The name to save the file as in S3 (e.g. "report-2024.csv"). If left blank, a unique name is generated automatically.',
    }),
    acl: Property.StaticDropdown({
      displayName: 'Access Control (ACL)',
      description: 'Who can access this file after upload. Use "Private" for internal files, "Public Read" to make the file publicly accessible via URL.',
      required: false,
      options: {
        options: [
          {
            label: 'Private (only your account)',
            value: 'private',
          },
          {
            label: 'Public Read (anyone can view)',
            value: 'public-read',
          },
          {
            label: 'Public Read/Write (anyone can view and upload)',
            value: 'public-read-write',
          },
          {
            label: 'Authenticated AWS Users Read',
            value: 'authenticated-read',
          },
          {
            label: 'AWS EC2 Read (aws-exec-read)',
            value: 'aws-exec-read',
          },
          {
            label: 'Bucket Owner Read',
            value: 'bucket-owner-read',
          },
          {
            label: 'Bucket Owner Full Control',
            value: 'bucket-owner-full-control',
          },
        ],
      },
    }),
    type: Property.ShortText({
      displayName: "Content Type",
      description: "Content Type of the uploaded file, if not set the API will try to figure out the content type.",
      required: false
    })
  },
  async run(context) {
    const authProps: S3AuthProps = context.auth.props;
    const { bucket } = authProps;
    const { file, fileName, acl, type } = context.propsValue;

    const s3 = await resolveS3Client({ authProps, server: context.server });

    const { contentType, extension } = resolveContentType({ file, type });

    const generatedName = new Date().toISOString() + Date.now() + extension;

    const finalFileName = fileName ? (fileName.endsWith(extension) ? fileName : fileName + extension) : generatedName;

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: finalFileName,
        ACL: acl as ObjectCannedACL | undefined,
        ContentType: contentType,
        Body: await file.stream(),
      },
    });
    const uploadResponse = await upload.done();

    return {
      fileName: finalFileName,
      etag: uploadResponse.ETag,
    };
  },
});

function resolveContentType({ file, type }: { file: ApFileRef; type: string | undefined }): { contentType: string; extension: string } {
  if (type) {
    const ext = mime.extension(type);
    if (!ext) {
      throw new Error("The content type entered does not exist or is misspelled, please check your input.");
    }
    return { contentType: type, extension: '.' + ext };
  }

  // ponytail: S3 doesn't require a content type; fall back to octet-stream rather than reject a storable file.
  const contentType = file.mimetype ?? (mime.lookup(file.filename) || 'application/octet-stream');
  const ext = mime.extension(contentType);
  return { contentType, extension: ext ? '.' + ext : '' };
}
