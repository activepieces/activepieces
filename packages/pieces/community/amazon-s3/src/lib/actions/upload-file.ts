import { Property, createAction } from '@activepieces/pieces-framework';
import { streamUtils } from '@activepieces/pieces-common';
import { Upload } from '@aws-sdk/lib-storage';
import { amazonS3CombinedAuth, S3AuthProps } from '../auth';
import { resolveS3Client } from '../common';
import { ObjectCannedACL } from '@aws-sdk/client-s3';
import mime from 'mime-types';
import { uploadFileOutputSchema } from '../output-schemas';

export const amazons3UploadFile = createAction({
  auth: amazonS3CombinedAuth,
  name: 'upload-file',
  outputSchema: uploadFileOutputSchema,
  classification: 'WRITE',
  displayName: 'Upload File',
  description: 'Upload a file to your bucket.',
  audience: 'human',
  aiMetadata: {
    description: 'Uploads a file to the configured S3 bucket, optionally setting a destination filename, content type, and canned ACL (e.g. private vs. public-read). Use to store new content in S3. Not idempotent: when no filename is given a unique timestamp-based key is generated, so each call writes a new object.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'file', display: 'section', label: 'File', icon: 'file', props: ['file', 'fileName'] },
  ],
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload.',
      required: true,
      streaming: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Path',
      required: false,
      description: "Empty: a generated name. The file's extension is added if missing.",
      placeholder: 'reports/report-2024.csv',
    }),
    acl: Property.StaticDropdown({
      displayName: 'Access Control',
      description: "Who can open the file. Empty: the bucket's default.",
      required: false,
      advanced: true,
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
            label: 'Public Read/Write (anyone can upload)',
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
      description: 'MIME type of the file. Empty: detected from its extension.',
      placeholder: 'text/csv',
      required: false,
      advanced: true,
    })
  },
  async run(context) {
    const authProps: S3AuthProps = context.auth.props;
    const { bucket } = authProps;
    const { file, fileName, acl, type } = context.propsValue;

    const s3 = await resolveS3Client({ authProps, server: context.server });

    let contentType, extension = null

    if(!type) {
      if (!file.extension || file.extension === undefined || !mime.contentType(file.extension)) {
        throw new Error("Content type could not be interpreted, please check the input file.")
      }

      extension = '.' + file.extension
      contentType = mime.contentType(extension) as string
    } 
    else if (!mime.extension(type as string)) {
      throw new Error("The content type entered does not exist or is misspelled, please check your input.")
    } else {
      contentType = type
      extension = '.' + mime.extension(type)
    }

    const generatedName = new Date().toISOString() + Date.now() + extension;

    const finalFileName = fileName ? (fileName.endsWith(extension) ? fileName : fileName + extension) : generatedName;

    // Streams the body in 5MB parts instead of buffering the whole file in the
    // sandbox. Each part is buffered before it is sent, so the SDK can replay it
    // on a retry; files under one part size go out as a plain PutObject.
    const { body } = streamUtils.toStreamingBody(file);
    const uploadResponse = await new Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: finalFileName,
        ACL: acl as ObjectCannedACL | undefined,
        ContentType: contentType,
        Body: body,
      },
    }).done();

    return {
      fileName: finalFileName,
      etag: uploadResponse.ETag,
    };
  },
});
