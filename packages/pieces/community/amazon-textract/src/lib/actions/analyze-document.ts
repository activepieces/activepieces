import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
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
    'Extract text, forms (key-value pairs), tables, and signatures from a document. Supports JPEG and PNG via direct upload; PDF and TIFF via S3 only. For multi-page PDFs, use Start Document Analysis instead.',
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
              description: 'The path to the file in your S3 bucket (e.g. "documents/invoice.pdf").',
              required: true,
            }),
          };
        }
        return {
          file: Property.File({
            displayName: 'File',
            description: 'The document to analyze. Only JPEG and PNG are supported for direct upload (max 5 MB). For PDF or TIFF files, use the "From S3 bucket" option instead.',
            required: true,
          }),
        };
      },
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
    const { source, document, featureTypes, queries } = context.propsValue;

    const file = source === 'file' ? document['file'] : undefined;
    const s3Bucket = source === 's3' ? (document['s3Bucket'] as string) : undefined;
    const s3Key = source === 's3' ? (document['s3Key'] as string) : undefined;

    try {
      const client = createTextractClient(context.auth.props);
      const documentInput = buildDocumentInput(file, s3Bucket, s3Key);

      // Always strip QUERIES from dropdown value — it requires QueriesConfig
      const resolvedFeatureTypes: FeatureType[] = (featureTypes as FeatureType[]).filter(
        (ft) => ft !== FeatureType.QUERIES
      );

      const command: ConstructorParameters<typeof AnalyzeDocumentCommand>[0] = {
        Document: documentInput,
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

      const response = await client.send(new AnalyzeDocumentCommand(command));
      return parseAnalysisBlocks(response.Blocks ?? []);
    } catch (e) {
      throw new Error(formatTextractError(e));
    }
  },
});
