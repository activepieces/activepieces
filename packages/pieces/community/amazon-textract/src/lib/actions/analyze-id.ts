import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
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
    source: Property.StaticDropdown({
      displayName: 'Document Source',
      description: 'Choose how to provide the document — upload a file directly or reference one already in S3.',
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
              description: 'The path to the file in your S3 bucket (e.g. "id-documents/passport.jpg").',
              required: true,
            }),
          };
        }
        return {
          file: Property.File({
            displayName: 'File',
            description: 'The ID document to analyze. Supported formats: JPEG, PNG, PDF (single page), TIFF. Maximum 10 MB.',
            required: true,
          }),
        };
      },
    }),
  },
  async run(context) {
    const { source, document } = context.propsValue;

    const file = source === 'file' ? document['file'] : undefined;
    const s3Bucket = source === 's3' ? (document['s3Bucket'] as string) : undefined;
    const s3Key = source === 's3' ? (document['s3Key'] as string) : undefined;

    try {
      const client = createTextractClient(context.auth.props);
      const documentInput = buildDocumentInput(file, s3Bucket, s3Key);
      const response = await client.send(new AnalyzeIDCommand({ DocumentPages: [documentInput] }));
      return parseIdentityDocuments(response.IdentityDocuments ?? []);
    } catch (e) {
      throw new Error(formatTextractError(e));
    }
  },
});
