import { Property, createAction } from '@activepieces/pieces-framework';
import { AnalyzeIDCommand } from '@aws-sdk/client-textract';
import { amazonTextractAuth } from '../auth';
import {
  createTextractClient,
  buildDocumentInput,
  parseIdentityDocuments,
  formatTextractError,
} from '../common';

export const analyzeId = createAction({
  auth: amazonTextractAuth,
  name: 'analyze-id',
  displayName: 'Analyze ID Document',
  description:
    'Extract structured data from identity documents such as driver\'s licenses and passports. Returns fields like name, date of birth, ID number, and expiry date.',
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The ID document to analyze. Supported formats: JPEG, PNG, PDF (single page), TIFF. Maximum 10 MB. Provide this OR the S3 fields below.',
      required: false,
    }),
    s3Bucket: Property.ShortText({
      displayName: 'S3 Bucket',
      description: 'S3 bucket containing the document. Required if no file is provided.',
      required: false,
    }),
    s3Key: Property.ShortText({
      displayName: 'S3 Object Key',
      description: 'S3 object key (path) of the document. Required if no file is provided.',
      required: false,
    }),
  },
  async run(context) {
    const { file, s3Bucket, s3Key } = context.propsValue;

    try {
      const client = createTextractClient(context.auth.props);
      const document = buildDocumentInput(file, s3Bucket, s3Key);

      const response = await client.send(
        new AnalyzeIDCommand({ DocumentPages: [document] })
      );

      return parseIdentityDocuments(response.IdentityDocuments ?? []);
    } catch (e) {
      throw new Error(formatTextractError(e));
    }
  },
});
