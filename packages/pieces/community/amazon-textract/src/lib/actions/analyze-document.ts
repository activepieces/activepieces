import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AnalyzeDocumentCommand,
  FeatureType,
} from '@aws-sdk/client-textract';
import { amazonTextractAuth } from '../auth';
import {
  createTextractClient,
  buildDocumentInput,
  parseAnalysisBlocks,
  formatTextractError,
} from '../common';

export const analyzeDocument = createAction({
  auth: amazonTextractAuth,
  name: 'analyze-document',
  displayName: 'Analyze Document',
  description:
    'Extract text, forms (key-value pairs), tables, and signatures from a document. Supports JPEG, PNG, PDF, and TIFF. For multi-page PDFs, use Start Document Analysis instead.',
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The document to analyze. Supported formats: JPEG, PNG, PDF (single page), TIFF. Maximum 10 MB. Provide this OR the S3 fields below.',
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
    featureTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Feature Types',
      description: 'Select what to extract. TABLES extracts table data. FORMS extracts key-value pairs. SIGNATURES detects signatures.',
      required: true,
      options: {
        options: [
          { label: 'Tables', value: FeatureType.TABLES },
          { label: 'Forms (Key-Value Pairs)', value: FeatureType.FORMS },
          { label: 'Signatures', value: FeatureType.SIGNATURES },
        ],
      },
      defaultValue: [FeatureType.TABLES, FeatureType.FORMS],
    }),
    queries: Property.Array({
      displayName: 'Queries',
      description:
        'Optional. Natural-language questions to ask about the document (e.g. "What is the patient name?"). When provided, the QUERIES feature is automatically enabled.',
      required: false,
    }),
  },
  async run(context) {
    const { file, s3Bucket, s3Key, featureTypes, queries } = context.propsValue;

    try {
      const client = createTextractClient(context.auth.props);
      const document = buildDocumentInput(file, s3Bucket, s3Key);

      // Always strip QUERIES from dropdown value — it requires QueriesConfig
      const resolvedFeatureTypes: FeatureType[] = (featureTypes as FeatureType[]).filter(
        (ft) => ft !== FeatureType.QUERIES
      );

      const command: ConstructorParameters<typeof AnalyzeDocumentCommand>[0] = {
        Document: document,
        FeatureTypes: resolvedFeatureTypes,
      };

      if (queries && queries.length > 0) {
        const queryStrings = queries.filter(
          (q): q is string => typeof q === 'string' && q.trim().length > 0
        );
        if (queryStrings.length > 0) {
          resolvedFeatureTypes.push(FeatureType.QUERIES);
          command.QueriesConfig = {
            Queries: queryStrings.map((text) => ({ Text: text.trim() })),
          };
        }
      }

      const response = await client.send(
        new AnalyzeDocumentCommand(command)
      );

      return parseAnalysisBlocks(response.Blocks ?? []);
    } catch (e) {
      throw new Error(formatTextractError(e));
    }
  },
});
