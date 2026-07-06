import { Property, createAction } from '@activepieces/pieces-framework';
import { amazonS3CombinedAuth, S3AuthProps } from '../auth';
import { resolveS3Client } from '../common';

export const readFile = createAction({
  auth: amazonS3CombinedAuth,
  name: 'read-file',
  displayName: 'Read File',
  description: 'Read a file from S3 to use it in other steps',
  audience: 'both',
  aiMetadata: {
    description: 'Downloads a single object from the configured S3 bucket by its full key (path) and makes its contents available as a file for later steps. Use to fetch a known file when you have its exact key. Reading the same key repeatedly returns the same content with no side effect (idempotent).',
    idempotent: true,
  },
  props: {
    key: Property.ShortText({
      displayName: 'File Path',
      description: 'The full path to the file within your S3 bucket (e.g. "documents/report.csv" or "myfile.txt"). This is also called the S3 "key".',
      required: true,
    }),
  },
  async run(context) {
    const authProps: S3AuthProps = context.auth.props;
    const { bucket } = authProps;
    const { key } = context.propsValue;
    const s3 = await resolveS3Client({ authProps, server: context.server });

    const file = await s3.getObject({
      Bucket: bucket,
      Key: key,
    });
    const base64 = await file.Body?.transformToString('base64');
    if (!base64) {
      throw new Error(`Could not read file ${key} from S3`);
    }
    return await context.files.write({
      fileName: key,
      data: Buffer.from(base64, 'base64'),
    });
  },
});
