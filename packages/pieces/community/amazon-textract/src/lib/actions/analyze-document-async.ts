import { Property, createAction } from '@activepieces/pieces-framework';
import {
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  GetDocumentAnalysisCommandOutput,
  FeatureType,
  JobStatus,
  Block,
} from '@aws-sdk/client-textract';
import { amazonTextractAuth } from '../auth';
import { createTextractClient, parseAnalysisBlocks, formatTextractError } from '../common';

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 5 * 60 * 1000;

export const analyzeDocumentAsync = createAction({
  auth: amazonTextractAuth,
  name: 'analyze-document-async',
  displayName: 'Analyze Document from S3 (Multi-Page)',
  description:
    'Extract text, forms, tables, and signatures from a PDF or TIFF stored in S3. Works with both single-page and multi-page documents. This action waits for processing to finish and returns all results automatically — no extra steps needed.',
  props: {
    s3Bucket: Property.ShortText({
      displayName: 'S3 Bucket',
      description: 'The name of the S3 bucket containing your document.',
      required: true,
    }),
    s3Key: Property.ShortText({
      displayName: 'S3 File Path',
      description: 'The path to the file in your S3 bucket (e.g. "reports/contract.pdf"). Supports JPEG, PNG, PDF, and TIFF. Multi-page PDFs and TIFFs are fully supported.',
      required: true,
    }),
    featureTypes: Property.StaticMultiSelectDropdown({
      displayName: 'What to Extract',
      description: 'Choose what to extract. Tables: structured grid data. Forms: labelled fields and their values (e.g. "Name: John"). Signatures: signature locations. Layout: document structure like titles, headers, and sections.',
      required: true,
      options: {
        options: [
          { label: 'Tables', value: FeatureType.TABLES },
          { label: 'Forms (Key-Value Pairs)', value: FeatureType.FORMS },
          { label: 'Signatures', value: FeatureType.SIGNATURES },
          { label: 'Layout (Titles, Headers, Sections)', value: FeatureType.LAYOUT },
        ],
      },
      defaultValue: [FeatureType.TABLES, FeatureType.FORMS],
    }),
    queries: Property.Array({
      displayName: 'Questions to Ask (Optional)',
      description: 'Ask plain-English questions about the document and get direct answers (e.g. "What is the invoice total?" or "What is the patient name?").',
      required: false,
    }),
    clientRequestToken: Property.ShortText({
      displayName: 'Deduplication Token (Optional)',
      description: 'A unique string (e.g. "invoice-2024-001") to prevent accidentally running the same job twice. If you submit the same token again within 5 minutes, AWS returns the original job result instead of starting a new one.',
      required: false,
    }),
  },
  async run(context) {
    const { s3Bucket, s3Key, featureTypes, queries, clientRequestToken } = context.propsValue;

    try {
      const client = createTextractClient(context.auth.props);

      const resolvedFeatureTypes: FeatureType[] = [...(featureTypes as FeatureType[])];
      const startInput: ConstructorParameters<typeof StartDocumentAnalysisCommand>[0] = {
        DocumentLocation: {
          S3Object: { Bucket: s3Bucket, Name: s3Key },
        },
        FeatureTypes: resolvedFeatureTypes,
        ClientRequestToken: clientRequestToken || undefined,
      };

      if (queries && queries.length > 0) {
        const queryStrings = queries.filter(
          (q): q is string => typeof q === 'string' && q.trim().length > 0
        );
        if (queryStrings.length > 0) {
          resolvedFeatureTypes.push(FeatureType.QUERIES);
          startInput.QueriesConfig = {
            Queries: queryStrings.map((text) => ({ Text: text.trim() })),
          };
        }
      }

      const startResponse = await client.send(new StartDocumentAnalysisCommand(startInput));

      const jobId = startResponse.JobId;
      if (!jobId) {
        throw new Error('Could not start the document analysis job. Please try again.');
      }

      const timeoutAt = Date.now() + TIMEOUT_MS;
      const allBlocks: Block[] = [];
      const allWarnings: string[] = [];
      let totalPages = 0;

      do {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

        let nextToken: string | undefined = undefined;

        do {
          const pollResponse: GetDocumentAnalysisCommandOutput = await client.send(
            new GetDocumentAnalysisCommand({
              JobId: jobId,
              MaxResults: 1000,
              NextToken: nextToken,
            })
          );

          const status = pollResponse.JobStatus;

          if (status === JobStatus.FAILED) {
            throw new Error(
              `Document analysis failed: ${pollResponse.StatusMessage ?? 'AWS could not process this document. Check that the file is a valid, non-password-protected PDF, TIFF, JPEG, or PNG.'}`
            );
          }

          if (status === JobStatus.IN_PROGRESS) {
            break;
          }

          // Collect page count from first paginated response
          if (totalPages === 0 && pollResponse.DocumentMetadata?.Pages) {
            totalPages = pollResponse.DocumentMetadata.Pages;
          }

          // Collect any warnings (e.g. pages that could not be read)
          for (const warning of pollResponse.Warnings ?? []) {
            if (warning.ErrorCode) {
              const pages = warning.Pages?.join(', ') ?? 'unknown';
              allWarnings.push(`${warning.ErrorCode} on page(s): ${pages}`);
            }
          }

          allBlocks.push(...(pollResponse.Blocks ?? []));
          nextToken = pollResponse.NextToken;

          if (!nextToken) {
            const result = parseAnalysisBlocks(allBlocks);
            return {
              ...result,
              pageCount: totalPages || result.pageCount,
              status: status === JobStatus.PARTIAL_SUCCESS ? 'PARTIAL_SUCCESS' : 'SUCCEEDED',
              warnings: allWarnings.length > 0
                ? `Some pages could not be fully processed: ${allWarnings.join('; ')}`
                : undefined,
            };
          }
        } while (nextToken);
      } while (Date.now() < timeoutAt);

      throw new Error(
        'Document analysis is taking longer than expected (5 minutes). This can happen with very large documents. Try splitting the document into smaller parts and running this action on each part.'
      );
    } catch (e) {
      const err = e as { message?: string };
      if (
        err.message?.startsWith('Document analysis failed') ||
        err.message?.startsWith('Document analysis is taking longer') ||
        err.message?.startsWith('Could not start')
      ) {
        throw e;
      }
      throw new Error(formatTextractError(e));
    }
  },
});
