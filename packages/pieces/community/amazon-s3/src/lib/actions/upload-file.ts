import { Property, createAction } from '@activepieces/pieces-framework';
import { amazonS3Auth } from '../..';
import { createS3 } from '../common';
import { ObjectCannedACL } from '@aws-sdk/client-s3';
import mime from 'mime-types';

export const amazons3UploadFile = createAction({
  auth: amazonS3Auth,
  name: 'upload-file',
  displayName: 'Upload File',
  description: 'Upload an File to S3',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      required: false,
      description: 'The File Name to use, if not set the API will try to figure out the file name.',
    }),
    acl: Property.StaticDropdown({
      displayName: 'ACL',
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
    type: Property.ShortText({
      displayName: "Content Type",
      description: "Content Type of the uploaded file, if not set the API will try to figure out the content type.",
      required: false
    })
  },
  async run(context) {
    const { bucket } = context.auth;
    const { file, fileName, acl, type } = context.propsValue;

    const s3 = createS3(context.auth);

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

    const uploadResponse = await s3.putObject({
      Bucket: bucket,
      Key: finalFileName,
      ACL: acl as ObjectCannedACL | undefined,
      ContentType: contentType,
      Body: file.data,
    });

    return {
      fileName: finalFileName,
      etag: uploadResponse.ETag,
    };
  },
});
