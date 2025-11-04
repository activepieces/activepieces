import { Property, createAction } from '@activepieces/pieces-framework';
import { amazonS3Auth } from '../../index';
import { createS3 } from '../common';
import { ListObjectsV2CommandInput } from '@aws-sdk/client-s3';

interface S3File {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  storageClass?: string;
}

interface ListFilesResult {
  files: S3File[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

export const listFiles = createAction({
  auth: amazonS3Auth,
  name: 'list-files',
  displayName: 'List Files',
  description: 'List all files from an S3 bucket folder/prefix.',
  props: {
    prefix: Property.ShortText({
      displayName: 'Folder path',
      description: 'The folder path to list files from (e.g., "folder/"). Leave empty to list from root.',
      required: false,
    }),
    maxKeys: Property.Number({
      displayName: 'Maximum Files',
      description: 'Maximum number of files to return (1-1000)',
      required: false,
      defaultValue: 1000,
    }),

  },
  async run(context) {
    const s3 = createS3(context.auth);

    const params: ListObjectsV2CommandInput = {
      Bucket: context.auth.bucket,
      MaxKeys: Math.min(Math.max(context.propsValue.maxKeys || 1000, 1), 1000),
    };

    if (context.propsValue.prefix) {
      params.Prefix = context.propsValue.prefix;
    }



    try {
      const response = await s3.listObjectsV2(params);
      
      const files: S3File[] = [];
      
      // Include all files (including those in subfolders)
      if (response.Contents) {
        for (const object of response.Contents) {
          // Skip if required properties are missing
          if (!object.Key || object.Size === undefined || !object.LastModified || !object.ETag) {
            continue;
          }
          
          files.push({
            key: object.Key,
            size: object.Size,
            lastModified: object.LastModified,
            etag: object.ETag,
            storageClass: object.StorageClass,
          });
        }
      }

      // Sort files by lastModified date (most recent first)
      files.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

      const result: ListFilesResult = {
        files,
        isTruncated: response.IsTruncated || false,
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to list files from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}); 