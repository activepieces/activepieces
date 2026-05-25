import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
import { DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { amazonTextractAuth } from '../auth';
import {
  createTextractClient,
  buildDocumentInput,
  parseTextBlocks,
  formatTextractError,
} from '../common';

export const detectDocumentText = createAction({
  auth: amazonTextractAuth,
  name: 'detect-document-text',
  displayName: 'Detect Document Text',
  description:
    'Extract plain text from a document. Faster and cheaper than Analyze Document — use this when you only need the text content without forms or tables. Supports JPEG and PNG via direct upload; PDF and TIFF via S3 only.',
  props: {
    source: Property.StaticDropdown({
      displayName: 'Document Source',
      description:
        'Choose how to provide the document — upload a file directly or reference one already in S3.',
      required: true,
      defaultValue: 'file',
      options: {
        options: [
          { label: 'Upload a file', value: 'file' },
          { label: 'From S3 bucket', value: 's3' },
        ],
      },
    }),
    document: Property.DynamicProperties({
      auth: amazonTextractAuth,
      displayName: 'Document',
      required: true,
      refreshers: ['source'],
      props: async ({ source }): Promise<DynamicPropsValue> => {
        if (source === 's3') {
          return {
            s3Bucket: Property.ShortText({
              displayName: 'S3 Bucket',
              description: 'The name of your S3 bucket containing the document.',
              required: true,
            }),
            s3Key: Property.ShortText({
              displayName: 'S3 File Path',
              description: 'The path to the file in your S3 bucket (e.g. "documents/letter.pdf").',
              required: true,
            }),
          };
        }
        return {
          file: Property.File({
            displayName: 'File',
            description: 'The document to read. Only JPEG and PNG are supported for direct upload (max 5 MB). For PDF or TIFF files, use the "From S3 bucket" option instead.',
            required: true,
          }),
        };
      },
    }),
  },
  async run(context) {
    const { source, document } = context.propsValue;

    const file = source === 'file' ? document['file'] : undefined;
    const s3Bucket =
      source === 's3' ? (document['s3Bucket'] as string) : undefined;
    const s3Key = source === 's3' ? (document['s3Key'] as string) : undefined;

    try {
      const client = createTextractClient(context.auth.props);
      const documentInput = buildDocumentInput(file, s3Bucket, s3Key);

      const response = await client.send(
        new DetectDocumentTextCommand({ Document: documentInput })
      );

      return parseTextBlocks(response.Blocks ?? []);
    } catch (e) {
      throw new Error(formatTextractError(e));
    }
  },
});
