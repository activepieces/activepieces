import { Property, createAction } from '@activepieces/pieces-framework';
import { amazonS3CombinedAuth, S3AuthProps } from '../auth';
import { resolveS3Client } from '../common';
import { ListObjectsV2CommandInput } from '@aws-sdk/client-s3';
import { listFilesOutputSchema } from '../output-schemas';

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
  outputSchema: listFilesOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Files',
  description: 'List the files in your bucket or in one of its folders.',
  audience: 'human',
  aiMetadata: {
    description: 'Lists objects in the configured S3 bucket, optionally filtered to a folder prefix (empty prefix lists the whole bucket), capped at a maximum count (1-1000, default 1000) and sorted newest-first. Use to discover files or look up an object key before reading, moving, or deleting it. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'filter', display: 'section', label: 'Filter', icon: 'filter', props: ['prefix', 'maxKeys'] },
  ],
  props: {
    prefix: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Only list files in this folder. Empty: the whole bucket.',
      placeholder: 'invoices/',
      required: false,
    }),
    maxKeys: Property.Number({
      displayName: 'Maximum Files',
      description: 'How many files to return, up to 1,000.',
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
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