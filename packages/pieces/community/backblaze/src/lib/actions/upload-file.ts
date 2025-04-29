import { Property, createAction } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../..';
import { createBackBlazeS3 } from '../common';
import { ObjectCannedACL } from '@aws-sdk/client-s3';

export const backBlazes3UploadFileAction = createAction({
  auth: backBlazeS3Auth,
  name: 'upload-backblaze-file',
  displayName: 'Upload File',
  description: 'Upload an File to bucket.',
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
    const { bucket } = context.auth;
    const { file, fileName, acl, type } = context.propsValue;

    const s3 = createBackBlazeS3(context.auth);

    const contentType = type;
    const [_, ext] = contentType.split('/');
    const extension = '.' + ext;

    const generatedName = new Date().toISOString() + Date.now() + extension;

    const finalFileName = fileName ? fileName + extension : generatedName;

    const uploadResponse = await s3.putObject({
      Bucket: bucket,
      Key: finalFileName,
      ACL: acl as ObjectCannedACL | undefined,
      ContentType: contentType,
      Body: file.data,
    });

    const endpoint = context.auth.endpoint ? context.auth.endpoint :"";
    const cleanEndpoint = endpoint.replace("https://","")
    const url = `https://${bucket}.${cleanEndpoint}/${finalFileName}`
    return {
      fileName: finalFileName,
      etag: uploadResponse.ETag,
      url: url,
    };
  },
});
