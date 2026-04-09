import { Property, createAction } from '@activepieces/pieces-framework';
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
    'Extract plain text from a document. Faster and cheaper than Analyze Document — use this when you only need the text content without forms or tables. Supports JPEG, PNG, PDF (single page), and TIFF.',
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The document to read. Supported formats: JPEG, PNG, PDF (single page), TIFF. Maximum 10 MB. Provide this OR the S3 fields below.',
      required: false,
    }),
    s3Bucket: Property.ShortText({
      displayName: 'S3 Bucket',
      description: 'S3 bucket containing the document. Required if no file is provided.',
      required: false,
    }),
    s3Key: Property.ShortText({
      displayName: 'S3 File Path',
      description: 'The path to the file in your S3 bucket (e.g. "documents/letter.pdf"). Required if no file is uploaded above.',
      required: false,
    }),
  },
  async run(context) {
    const { file, s3Bucket, s3Key } = context.propsValue;

    try {
      const client = createTextractClient(context.auth.props);
      const document = buildDocumentInput(file, s3Bucket, s3Key);

      const response = await client.send(
        new DetectDocumentTextCommand({ Document: document })
      );

      return parseTextBlocks(response.Blocks ?? []);
    } catch (e) {
      throw new Error(formatTextractError(e));
    }
  },
});
