import { Property, createAction } from '@activepieces/pieces-framework';
import { amazonS3CombinedAuth, S3AuthProps } from '../auth';
import { resolveS3Client } from '../common';
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
  auth: amazonS3CombinedAuth,
  name: 'list-files',
  displayName: 'List Files',
  description: 'List all files from an S3 bucket folder/prefix.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists objects in the configured S3 bucket, optionally filtered to a folder prefix (empty prefix lists the whole bucket), capped at a maximum count (1-1000, default 1000) and sorted newest-first. Use to discover files or look up an object key before reading, moving, or deleting it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    prefix: Property.ShortText({
      displayName: 'Folder Path (Optional)',
      description: 'Filter results to a specific folder. Enter the folder path including the trailing slash (e.g. "invoices/" or "reports/2024/"). Leave empty to list all files in the bucket.',
      required: false,
    }),
    maxKeys: Property.Number({
      displayName: 'Maximum Files',
      description: 'Maximum number of files to return (1–1000). Defaults to 1000. Use a lower number if you only need the most recent files.',
      required: false,
      defaultValue: 1000,
    }),

  },
  async run(context) {
    const authProps: S3AuthProps = context.auth.props;
    const s3 = await resolveS3Client({ authProps, server: context.server });

    const params: ListObjectsV2CommandInput = {
      Bucket: authProps.bucket,
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