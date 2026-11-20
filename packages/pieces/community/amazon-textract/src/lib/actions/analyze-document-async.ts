import { ApFile, Property, ServerContext, createAction } from '@activepieces/pieces-framework';
import type { S3Client } from '@aws-sdk/client-s3';
import {
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  GetDocumentAnalysisCommandOutput,
  FeatureType,
  JobStatus,
  Block,
  TextractClient,
} from '@aws-sdk/client-textract';
import { randomUUID } from 'node:crypto';
import { amazonTextractAuth, TextractAuth } from '../auth';
import { createS3Client, createTextractClient, parseAnalysisBlocks, formatTextractError } from '../common';

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 5 * 60 * 1000;
const UPLOAD_KEY_PREFIX = 'activepieces-textract-uploads';

export const analyzeDocumentAsync = createAction({
  auth: amazonTextractAuth,
  name: 'analyze-document-async',
  classification: 'READ',
  displayName: 'Analyze Document from S3 (Multi-Page)',
  description:
    'Extract text, forms, tables, and signatures from a PDF or TIFF. Works with both single-page and multi-page documents. Upload the file directly or point to one already in S3. This action waits for processing to finish and returns all results automatically — no extra steps needed.',
  audience: 'both',
  aiMetadata: { description: 'Analyze a multi-page (or single-page) document with AWS Textract, extracting forms, tables, signatures, and layout structure, optionally answering natural-language queries. Choose it for multi-page PDFs or TIFFs that the synchronous Analyze Document action cannot handle. Pass the document either as a file (the step stores it in the given S3 bucket while the job runs, then deletes it) or as the path of an object already in that bucket. It starts an async Textract job and blocks while polling until results are ready (up to a 5-minute timeout), then returns all pages. Effectively idempotent: it is a read-only extraction, and supplying the optional deduplication token makes AWS return the original job result if the same token is reused within 5 minutes.', idempotent: true },
  props: {
    s3Bucket: Property.ShortText({
      displayName: 'S3 Bucket',
      description: 'The S3 bucket for your document, in the same AWS region as your connection.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File to Upload (Optional)',
      description: 'A file to analyze. It stays in the bucket only while it is analyzed.',
      required: false,
    }),
    s3Key: Property.ShortText({
      displayName: 'S3 File Path',
      description: 'Path of a file already in the bucket. Not needed if you upload a file.',
      required: false,
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
    const { s3Bucket, s3Key, file, featureTypes, queries, clientRequestToken } = context.propsValue;
    const analysis: AnalysisOptions = {
      featureTypes: [...featureTypes],
      queries: queries ?? [],
      clientRequestToken: clientRequestToken || undefined,
    };

    try {
      if (file) {
        return await analyzeUploadedFile({
          auth: context.auth.props,
          server: context.server,
          bucket: s3Bucket,
          file,
          analysis,
        });
      }
      if (!s3Key) {
        throw new Error('Upload a file, or enter the S3 File Path of a document already in the bucket.');
      }
      const client = await createTextractClient({ auth: context.auth.props, server: context.server });
      return await analyzeS3Document({ client, bucket: s3Bucket, key: s3Key, analysis });
    } catch (e) {
      const err = e as { message?: string };
      if (
        err.message?.startsWith('Document analysis failed') ||
        err.message?.startsWith('Document analysis is taking longer') ||
        err.message?.startsWith('Could not start') ||
        err.message?.startsWith('Could not upload')
      ) {
        throw e;
      }
      throw new Error(formatTextractError(e));
    }
  },
});

async function analyzeUploadedFile({
  auth,
  server,
  bucket,
  file,
  analysis,
}: {
  auth: TextractAuth;
  server: ServerContext;
  bucket: string;
  file: ApFile;
  analysis: AnalysisOptions;
}) {
  const client = await createTextractClient({ auth, server });
  const s3 = await createS3Client({ auth, server });
  const key = await uploadDocument({ s3, bucket, file, clientRequestToken: analysis.clientRequestToken });
  try {
    const result = await analyzeS3Document({ client, bucket, key, analysis });
    const cleanupWarning = await deleteUploadedDocument({ s3, bucket, key });
    if (!cleanupWarning) {
      return result;
    }
    return {
      ...result,
      warnings: [result.warnings, cleanupWarning].filter(Boolean).join(' '),
    };
  } catch (e) {
    await deleteUploadedDocument({ s3, bucket, key });
    throw e;
  }
}

async function uploadDocument({
  s3,
  bucket,
  file,
  clientRequestToken,
}: {
  s3: S3Client;
  bucket: string;
  file: ApFile;
  clientRequestToken: string | undefined;
}): Promise<string> {
  const extension = file.extension?.replace(/[^a-zA-Z0-9]/g, '');
  const key = `${UPLOAD_KEY_PREFIX}/${clientRequestToken ?? randomUUID()}${extension ? `.${extension}` : ''}`;
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  try {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.data }));
  } catch (e) {
    throw new Error(
      `Could not upload the file to S3 bucket "${bucket}" (${describeAwsError(e)}). The connection needs s3:PutObject on this bucket, and the bucket must be in the same AWS region as the connection.`
    );
  }
  return key;
}

async function deleteUploadedDocument({
  s3,
  bucket,
  key,
}: {
  s3: S3Client;
  bucket: string;
  key: string;
}): Promise<string | undefined> {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return undefined;
  } catch (e) {
    return `The uploaded file could not be deleted from s3://${bucket}/${key} (${describeAwsError(e)}). Delete it yourself, or give the connection s3:DeleteObject on this bucket.`;
  }
}

function describeAwsError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  return error.name && error.name !== 'Error' ? `${error.name}: ${error.message}` : error.message;
}

async function analyzeS3Document({
  client,
  bucket,
  key,
  analysis,
}: {
  client: TextractClient;
  bucket: string;
  key: string;
  analysis: AnalysisOptions;
}) {
  const resolvedFeatureTypes: FeatureType[] = [...analysis.featureTypes];
  const startInput: ConstructorParameters<typeof StartDocumentAnalysisCommand>[0] = {
    DocumentLocation: {
      S3Object: { Bucket: bucket, Name: key },
    },
    FeatureTypes: resolvedFeatureTypes,
    ClientRequestToken: analysis.clientRequestToken,
  };

  const queryStrings = analysis.queries.filter(
    (q): q is string => typeof q === 'string' && q.trim().length > 0
  );
  if (queryStrings.length > 0) {
    resolvedFeatureTypes.push(FeatureType.QUERIES);
    startInput.QueriesConfig = {
      Queries: queryStrings.map((text) => ({ Text: text.trim() })),
    };
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

      if (totalPages === 0 && pollResponse.DocumentMetadata?.Pages) {
        totalPages = pollResponse.DocumentMetadata.Pages;
      }

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
}

type AnalysisOptions = {
  featureTypes: FeatureType[];
  queries: unknown[];
  clientRequestToken: string | undefined;
};
