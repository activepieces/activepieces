import { Property, createAction } from '@activepieces/pieces-framework';
import { AnalyzeExpenseCommand } from '@aws-sdk/client-textract';
import { amazonTextractAuth } from '../auth';
import {
  createTextractClient,
  buildDocumentInput,
  parseExpenseDocuments,
  formatTextractError,
} from '../common';

export const analyzeExpense = createAction({
  auth: amazonTextractAuth,
  name: 'analyze-expense',
  displayName: 'Analyze Expense',
  description:
    'Extract structured data from receipts and invoices: vendor name, totals, tax, line items, and more. Works best with clearly formatted receipts and invoices.',
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The receipt or invoice to analyze. Supported formats: JPEG, PNG, PDF (single page), TIFF. Maximum 10 MB. Provide this OR the S3 fields below.',
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
        new AnalyzeExpenseCommand({ Document: document })
      );

      return parseExpenseDocuments(response.ExpenseDocuments ?? []);
    } catch (e) {
      throw new Error(formatTextractError(e));
    }
  },
});
